// =============================================
// ADAPTADOR — THESPORTSDB API
// =============================================
// API gratuita con datos históricos de equipos y jugadorres.
// Gratis: 30 requests/día (sin API key para endpoints básicos).
// Documentación: https://www.thesportsdb.com/documentation

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

// =============================================
// TIPOS
// =============================================

export interface TSDTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string;
  strAlternate: string;
  intFormedYear: string;
  strStadium: string;
  strStadiumThumb: string;
  strStadiumCapacity: string;
  strManager: string;
  strDescriptionES: string;
}

export interface TSDEvent {
  idEvent: string;
  strEvent: string;
  strSeason: string;
  strRound: string;
  intRound: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string;
  intAwayScore: string;
  strStatus: string;
  dateEvent: string;
  strTime: string;
  strVenue: string;
  strHomeTeamBadge: string;
  strAwayTeamBadge: string;
}

export interface TSDPlayer {
  idPlayer: string;
  strPlayer: string;
  strNationality: string;
  strPosition: string;
  intLoved: string;
  strThumb: string;
}

// =============================================
// FUNCIONES
// =============================================

export async function searchTSDTeam(name: string): Promise<TSDTeam | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/searchteams.php?t=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    return data?.teams?.[0] || null;
  } catch {
    return null;
  }
}

export async function getTSDLastResults(
  teamId: string,
  limit: number = 10
): Promise<TSDEvent[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/eventslast.php?id=${teamId}`
    );
    const data = await res.json();
    return (data?.results || []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getTSDEventsByTeam(
  teamId: string,
  season: string
): Promise<TSDEvent[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/eventsseason.php?id=${teamId}&s=${season}`
    );
    const data = await res.json();
    return data?.events || [];
  } catch {
    return [];
  }
}

export async function getTSDNextEvents(teamId: string): Promise<TSDEvent[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/eventsnext.php?id=${teamId}`
    );
    const data = await res.json();
    return data?.events || [];
  } catch {
    return [];
  }
}

export async function getTSDTeamPlayers(teamId: string): Promise<TSDPlayer[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/lookup_all_players.php?id=${teamId}`
    );
    const data = await res.json();
    return data?.player || [];
  } catch {
    return [];
  }
}

/**
 * Calcula el rendimiento de un equipo desde TheSportsDB.
 */
export async function getTSDTeamForm(teamId: string) {
  const results = await getTSDLastResults(teamId, 10);

  let wins = 0, draws = 0, losses = 0;
  let goalsFor = 0, goalsAgainst = 0;

  results.forEach((event) => {
    const home = parseInt(event.intHomeScore || "0", 10);
    const away = parseInt(event.intAwayScore || "0", 10);
    const isHome = event.strHomeTeam === teamId || event.idEvent.includes(teamId);

    // No tenemos forma fácil de saber si es local, así que usamos el score
    goalsFor += home;
    goalsAgainst += away;

    if (home > away) wins++;
    else if (home === away) draws++;
    else losses++;
  });

  const total = results.length || 1;
  return {
    matchesPlayed: results.length,
    wins, draws, losses,
    goalsFor, goalsAgainst,
    avgGoalsFor: goalsFor / total,
    avgGoalsAgainst: goalsAgainst / total,
    winRate: wins / total,
  };
}
