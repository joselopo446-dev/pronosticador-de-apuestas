// =============================================
// SERVICIO DE DATOS ENRIQUECIDOS
// =============================================
// Combina datos de API-Football, Football-Data.org y TheSportsDB
// para crear un perfil completo de cada equipo.

import {
  getFDStandings,
  getFDTeamLastForm,
  getFDHead2Head,
  COMPETITIONS,
  type FDStanding,
} from "./football-data";

import { getStandings as getApiFootballStandings } from "./api-football";
import { searchTSDTeam, getTSDTeamForm } from "./thesportsdb";

// =============================================
// TIPOS
// =============================================

export interface TeamProfile {
  // Identificación
  teamName: string;
  teamId: number;
  tsdTeamId: string | null;

  // Estadísticas de liga
  leaguePosition: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;

  // Forma reciente (últimos 5)
  recentForm: string; // "WWDWL"
  recentWins: number;
  recentDraws: number;
  recentLosses: number;
  recentGoalsFor: number;
  recentGoalsAgainst: number;

  // Métricas calculadas
  attackStrength: number;   // 0-2 (promedio de goles por partido / 1.5)
  defenseStrength: number;  // 0-2 (1 - goles recibidos por partido / 1.5)
  formRating: number;       // 0-1 (win rate reciente)
  homeAdvantage: number;    // 1.0-1.5

  // Datos de TheSportsDB
  tsdWinRate: number;
  tsdAvgGoalsFor: number;
  tsdAvgGoalsAgainst: number;

  // Fuente de datos
  dataSource: string;
}

export interface EnrichedMatch {
  homeTeam: TeamProfile;
  awayTeam: TeamProfile;
  headToHead: {
    totalMatches: number;
    homeWins: number;
    draws: number;
    awayWins: number;
    avgGoals: number;
  };
  predictionInput: {
    homeAttack: number;
    homeDefense: number;
    awayAttack: number;
    awayDefense: number;
    homeAdvantage: number;
    homeForm: number;
    awayForm: number;
    homeGoalsScoredAvg: number;
    homeGoalsConcededAvg: number;
    awayGoalsScoredAvg: number;
    awayGoalsConcededAvg: number;
  };
}

// =============================================
// FUNCIONES
// =============================================

/**
 * Mapea IDs de API-Football a competiciones de Football-Data.org.
 */
function mapToFDCompetition(apiFootballLeagueId: number): string | null {
  const mapping: Record<number, string> = {
    140: COMPETITIONS.LA_LIGA,      // La Liga
    39: COMPETITIONS.PREMIER_LEAGUE, // Premier League
    78: COMPETITIONS.BUNDESLIGA,     // Bundesliga
    135: COMPETITIONS.SERIE_A,       // Serie A
    61: COMPETITIONS.LIGUE_1,        // Ligue 1
  };
  return mapping[apiFootballLeagueId] || null;
}

/**
 * Crea un perfil completo de un equipo usando múltiples fuentes.
 */
async function buildTeamProfile(
  teamName: string,
  teamId: number,
  leagueId: number
): Promise<TeamProfile> {
  // Perfil por defecto (si no hay datos de APIs)
  const defaultProfile: TeamProfile = {
    teamName,
    teamId,
    tsdTeamId: null,
    leaguePosition: 0,
    points: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    recentForm: "",
    recentWins: 0,
    recentDraws: 0,
    recentLosses: 0,
    recentGoalsFor: 0,
    recentGoalsAgainst: 0,
    attackStrength: 1.2,
    defenseStrength: 1.0,
    formRating: 0.5,
    homeAdvantage: 1.3,
    tsdWinRate: 0.5,
    tsdAvgGoalsFor: 1.3,
    tsdAvgGoalsAgainst: 1.0,
    dataSource: "default",
  };

  try {
    // Buscar en TheSportsDB
    const tsdTeam = await searchTSDTeam(teamName);
    const tsdTeamId = tsdTeam?.idTeam || null;

    // Datos de Football-Data.org (solo ligas europeas)
    const fdCode = mapToFDCompetition(leagueId);
    let fdStanding: FDStanding | null = null;
    let fdForm = { form: "", wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };

    if (fdCode) {
      fdStanding = await getFDStandings(fdCode);
      if (fdStanding) {
        const teamInTable = fdStanding.table.find(
          (t) =>
            t.team.name.toLowerCase().includes(teamName.toLowerCase()) ||
            t.team.shortName.toLowerCase().includes(teamName.toLowerCase()) ||
            t.team.tla.toLowerCase() === teamName.toLowerCase().slice(0, 3)
        );
        if (teamInTable) {
          fdForm = await getFDTeamLastForm(teamInTable.team.id, 5);
        }
      }
    }

    // Para Liga MX: usar API-Football standings
    let apiFootballData: { position: number; points: number; played: number; won: number; draw: number; lost: number; goalsFor: number; goalsAgainst: number; goalDifference: number; form: string } | null = null;
    if (!fdCode && leagueId === 262) {
      try {
        const season = new Date().getFullYear();
        const apiStandings = await getApiFootballStandings(leagueId, season);
        if (apiStandings && apiStandings.length > 0) {
          const leagueStanding = apiStandings[0];
          // standings is Array<Array<...>>
          if (leagueStanding.standings && leagueStanding.standings.length > 0) {
            const standingsArray = leagueStanding.standings[0];
            if (standingsArray) {
              const teamData = standingsArray.find(
                (t: { team: { name: string } }) =>
                  t.team.name.toLowerCase().includes(teamName.toLowerCase())
              );
              if (teamData) {
                apiFootballData = {
                  position: teamData.rank,
                  points: teamData.points,
                  played: teamData.all?.played || 0,
                  won: teamData.all?.win || 0,
                  draw: teamData.all?.draw || 0,
                  lost: teamData.all?.lose || 0,
                  goalsFor: teamData.all?.goals?.for || 0,
                  goalsAgainst: teamData.all?.goals?.against || 0,
                  goalDifference: teamData.goalsDiff || 0,
                  form: teamData.form || "",
                };
              }
            }
          }
        }
      } catch (e) {
        console.error("Error fetching Liga MX standings:", e);
      }
    }

    // Datos de TheSportsDB
    let tsdForm = { winRate: 0.5, avgGoalsFor: 1.3, avgGoalsAgainst: 1.0 };
    if (tsdTeamId) {
      const tsdData = await getTSDTeamForm(tsdTeamId);
      tsdForm = {
        winRate: tsdData.winRate,
        avgGoalsFor: tsdData.avgGoalsFor,
        avgGoalsAgainst: tsdData.avgGoalsAgainst,
      };
    }

    // Construir perfil combinando datos
    const profile: TeamProfile = {
      ...defaultProfile,
      tsdTeamId,
      recentForm: fdForm.form || apiFootballData?.form || defaultProfile.recentForm,
      recentWins: fdForm.wins || apiFootballData?.won || 0,
      recentDraws: fdForm.draws || apiFootballData?.draw || 0,
      recentLosses: fdForm.losses || apiFootballData?.lost || 0,
      recentGoalsFor: fdForm.goalsFor || apiFootballData?.goalsFor || 0,
      recentGoalsAgainst: fdForm.goalsAgainst || apiFootballData?.goalsAgainst || 0,
      tsdWinRate: tsdForm.winRate,
      tsdAvgGoalsFor: tsdForm.avgGoalsFor,
      tsdAvgGoalsAgainst: tsdForm.avgGoalsAgainst,
      dataSource: [
        fdStanding ? "football-data" : "",
        apiFootballData ? "api-football" : "",
        tsdTeamId ? "thesportsdb" : "",
      ].filter(Boolean).join("+") || "defaults",
    };

    // Usar datos de football-data.org si están disponibles
    if (fdStanding) {
      const teamInTable = fdStanding.table.find(
        (t) =>
          t.team.name.toLowerCase().includes(teamName.toLowerCase()) ||
          t.team.shortName.toLowerCase().includes(teamName.toLowerCase())
      );

      if (teamInTable) {
        profile.leaguePosition = teamInTable.position;
        profile.points = teamInTable.points;
        profile.played = teamInTable.playedGames;
        profile.won = teamInTable.won;
        profile.drawn = teamInTable.draw;
        profile.lost = teamInTable.lost;
        profile.goalsFor = teamInTable.goalsFor;
        profile.goalsAgainst = teamInTable.goalsAgainst;
        profile.goalDifference = teamInTable.goalDifference;
      }
    }

    // Usar datos de API-Football para Liga MX si están disponibles
    if (apiFootballData) {
      profile.leaguePosition = apiFootballData.position;
      profile.points = apiFootballData.points;
      profile.played = apiFootballData.played;
      profile.won = apiFootballData.won;
      profile.drawn = apiFootballData.draw;
      profile.lost = apiFootballData.lost;
      profile.goalsFor = apiFootballData.goalsFor;
      profile.goalsAgainst = apiFootballData.goalsAgainst;
      profile.goalDifference = apiFootballData.goalDifference;
    }

    // Calcular métricas
    const totalPlayed = profile.played || 1;
    // Si no hay datos de goles, usar valores por defecto
    if (profile.goalsFor > 0) {
      profile.attackStrength = Math.min(2, (profile.goalsFor / totalPlayed) / 1.5);
      profile.defenseStrength = Math.min(2, 1 - (profile.goalsAgainst / totalPlayed) / 2);
    } else {
      // Usar TheSportsDB data o defaults
      profile.attackStrength = tsdForm.avgGoalsFor > 0 ? tsdForm.avgGoalsFor / 1.5 : 1.2;
      profile.defenseStrength = tsdForm.avgGoalsAgainst > 0 ? 1 - tsdForm.avgGoalsAgainst / 2 : 1.0;
    }
    
    // Form rating: usar datos de FD o API-Football
    const formWins = fdForm.wins || apiFootballData?.won || 0;
    const formDraws = fdForm.draws || apiFootballData?.draw || 0;
    const formLosses = fdForm.losses || apiFootballData?.lost || 0;
    profile.formRating =
      (formWins * 1 + formDraws * 0.5) / Math.max(formWins + formDraws + formLosses, 1);

    // Calcular home advantage basado en datos
    const homeWinRate = profile.played > 0
      ? (profile.won * 0.55 + profile.drawn * 0.15) / totalPlayed
      : 0.45;
    profile.homeAdvantage = 1.0 + homeWinRate * 0.5; // 1.0 - 1.5

    return profile;
  } catch (error) {
    console.error(`Error building profile for ${teamName}:`, error);
    return defaultProfile;
  }
}

/**
 * Obtiene datos enriquecidos para un partido.
 */
export async function getEnrichedMatchData(
  homeTeamName: string,
  homeTeamId: number,
  awayTeamName: string,
  awayTeamId: number,
  leagueId: number
): Promise<EnrichedMatch> {
  // Obtener perfiles en paralelo
  const [homeProfile, awayProfile] = await Promise.all([
    buildTeamProfile(homeTeamName, homeTeamId, leagueId),
    buildTeamProfile(awayTeamName, awayTeamId, leagueId),
  ]);

  // Datos de enfrentamientos directos (simplificado)
  const h2h = {
    totalMatches: 0,
    homeWins: 0,
    draws: 0,
    awayWins: 0,
    avgGoals: 2.7,
  };

  // Construir input para el modelo ML
  const predictionInput = {
    homeAttack: homeProfile.attackStrength,
    homeDefense: homeProfile.defenseStrength,
    awayAttack: awayProfile.attackStrength,
    awayDefense: awayProfile.defenseStrength,
    homeAdvantage: homeProfile.homeAdvantage,
    homeForm: homeProfile.formRating,
    awayForm: awayProfile.formRating,
    homeGoalsScoredAvg: homeProfile.recentGoalsFor / Math.max(homeProfile.recentWins + homeProfile.recentDraws + homeProfile.recentLosses, 1),
    homeGoalsConcededAvg: homeProfile.recentGoalsAgainst / Math.max(homeProfile.recentWins + homeProfile.recentDraws + homeProfile.recentLosses, 1),
    awayGoalsScoredAvg: awayProfile.recentGoalsFor / Math.max(awayProfile.recentWins + awayProfile.recentDraws + awayProfile.recentLosses, 1),
    awayGoalsConcededAvg: awayProfile.recentGoalsAgainst / Math.max(awayProfile.recentWins + awayProfile.recentDraws + awayProfile.recentLosses, 1),
  };

  return {
    homeTeam: homeProfile,
    awayTeam: awayProfile,
    headToHead: h2h,
    predictionInput,
  };
}

/**
 * Obtiene la tabla de posiciones enriquecida.
 */
export async function getEnrichedStandings(leagueId: number) {
  const fdCode = mapToFDCompetition(leagueId);
  if (!fdCode) return null;

  const standings = await getFDStandings(fdCode);
  if (!standings) return null;

  return standings.table.map((t) => ({
    position: t.position,
    teamName: t.team.name,
    teamShortName: t.team.shortName,
    teamCrest: t.team.crest,
    played: t.playedGames,
    won: t.won,
    drawn: t.draw,
    lost: t.lost,
    points: t.points,
    goalsFor: t.goalsFor,
    goalsAgainst: t.goalsAgainst,
    goalDifference: t.goalDifference,
    form: t.form,
    attackStrength: (t.goalsFor / Math.max(t.playedGames, 1)) / 1.5,
    defenseStrength: 1 - (t.goalsAgainst / Math.max(t.playedGames, 1)) / 2,
  }));
}
