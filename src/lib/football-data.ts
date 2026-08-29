// =============================================
// ADAPTADOR — FOOTBALL-DATA.ORG API (v4)
// =============================================
// API gratuita con datos de ligas europeas, incluyendo La Liga.
// Rate limit: 10 requests/minuto (plan gratuito).
// Documentación: https://docs.football-data.org

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || "";

// IDs de competiciones en football-data.org
export const COMPETITIONS = {
  PREMIER_LEAGUE: "PL",
  LA_LIGA: "PD",
  BUNDESLIGA: "BL1",
  SERIE_A: "SA",
  LIGUE_1: "FL1",
  CHAMPIONS_LEAGUE: "CL",
} as const;

async function fetchFootballData<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  if (!API_KEY) {
    console.warn("[football-data] API key not configured");
    return [] as unknown as T;
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url.toString(), {
    headers: { "X-Auth-Token": API_KEY },
    next: { revalidate: 1800 }, // 30 min cache
  });

  if (!res.ok) {
    console.error(`Football-Data Error: ${res.status}`);
    return [] as unknown as T;
  }

  return res.json();
}

// =============================================
// TIPOS
// =============================================

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: {
    winner: string | null;
    duration: string;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

export interface FDStanding {
  stage: string;
  type: string;
  table: Array<{
    position: number;
    team: FDTeam;
    playedGames: number;
    won: number;
    draw: number;
    lost: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    form: string;
  }>;
}

export interface FDTeamMatch {
  matches: FDMatch[];
}

// =============================================
// FUNCIONES
// =============================================

export async function getFDStandings(competitionCode: string): Promise<FDStanding | null> {
  const data = await fetchFootballData<{ standings: FDStanding[] }>(
    `/competitions/${competitionCode}/standings`
  );
  return data?.standings?.find((s) => s.type === "TOTAL") || null;
}

export async function getFDFixtures(
  competitionCode: string,
  dateFrom?: string,
  dateTo?: string
): Promise<FDMatch[]> {
  const params: Record<string, string> = {};
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const data = await fetchFootballData<{ matches: FDMatch[] }>(
    `/competitions/${competitionCode}/matches`,
    params
  );
  return data?.matches || [];
}

export async function getFDTeamMatches(
  teamId: number,
  limit: number = 10
): Promise<FDMatch[]> {
  const data = await fetchFootballData<FDTeamMatch>(
    `/teams/${teamId}/matches`,
    { status: "FINISHED", limit: String(limit) }
  );
  return data?.matches || [];
}

export async function getFDTeamLastForm(
  teamId: number,
  limit: number = 5
): Promise<{ form: string; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }> {
  const matches = await getFDTeamMatches(teamId, limit);

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  let formStr = "";

  matches.forEach((m) => {
    const isHome = m.homeTeam.id === teamId;
    const gf = isHome ? m.score.fullTime.home : m.score.fullTime.away;
    const ga = isHome ? m.score.fullTime.away : m.score.fullTime.home;

    if (gf !== null && ga !== null) {
      goalsFor += gf;
      goalsAgainst += ga;
      if (gf > ga) { wins++; formStr += "W"; }
      else if (gf === ga) { draws++; formStr += "D"; }
      else { losses++; formStr += "L"; }
    }
  });

  return {
    form: formStr.slice(-5),
    wins, draws, losses, goalsFor, goalsAgainst,
  };
}

export async function getFDHead2Head(
  team1Id: number,
  team2Id: number,
  limit: number = 10
): Promise<FDMatch[]> {
  const data = await fetchFootballData<{ matches: FDMatch[] }>(
    `/teams/${team1Id}/matches`,
    { status: "FINISHED", limit: String(limit * 2) }
  );

  return (data?.matches || [])
    .filter((m) =>
      (m.homeTeam.id === team2Id || m.awayTeam.id === team2Id)
    )
    .slice(0, limit);
}
