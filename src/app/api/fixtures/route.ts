// =============================================
// API — OBTENER FIXTURES REALES
// =============================================
// Combina datos de API-Football y Football-Data.org
// para obtener los partidos programados de las 3 ligas.

import { NextRequest, NextResponse } from "next/server";
import { getFDFixtures, COMPETITIONS } from "@/lib/football-data";

const API_FOOTBALL_BASE = process.env.API_FOOTBALL_BASE_URL || "https://api-football-v1.p.rapidapi.com/v3";
const API_FOOTBALL_KEY = process.env.RAPIDAPI_KEY || "";

interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  date: string;
  status: string;
  matchday: number;
  venue: string;
  league: string;
  leagueId: number;
  score?: {
    home: number | null;
    away: number | null;
  };
}

// Liga MX: obtiene fixtures de API-Football
async function getLigaMXFixtures(): Promise<Fixture[]> {
  if (!API_FOOTBALL_KEY) {
    console.warn("[fixtures] API-Football key not configured");
    return [];
  }

  try {
    const season = new Date().getFullYear();
    const url = `${API_FOOTBALL_BASE}/fixtures?league=262&season=${season}&status=NS&next=10`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": API_FOOTBALL_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.error(`[fixtures] API-Football Liga MX error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.response || []).map((f: Record<string, unknown>) => {
      const fixture = f.fixture as Record<string, unknown>;
      const teams = f.teams as Record<string, Record<string, unknown>>;
      const league = f.league as Record<string, unknown>;
      const home = teams.home as Record<string, unknown>;
      const away = teams.away as Record<string, unknown>;
      const venue = fixture.venue as Record<string, unknown>;
      const status = fixture.status as Record<string, unknown>;
      return {
        id: fixture.id as number,
        homeTeam: home.name as string,
        awayTeam: away.name as string,
        homeTeamLogo: home.logo as string,
        awayTeamLogo: away.logo as string,
        date: fixture.date as string,
        status: status.short as string,
        matchday: league.round ? parseInt(String(league.round).replace(/\D/g, "")) || 0 : 0,
        venue: (venue.name as string) || "",
        league: "Liga MX",
        leagueId: 262,
      };
    });
  } catch (error) {
    console.error("[fixtures] Error fetching Liga MX:", error);
    return [];
  }
}

// La Liga y Premier League: usa Football-Data.org
async function getFootballDataFixtures(competitionCode: string, leagueName: string, leagueId: number): Promise<Fixture[]> {
  try {
    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const dateFrom = today.toISOString().split("T")[0];
    const dateTo = twoWeeksLater.toISOString().split("T")[0];

    const matches = await getFDFixtures(competitionCode, dateFrom, dateTo);
    
    return (matches || [])
      .filter((m) => m.status === "TIMED" || m.status === "SCHEDULED")
      .slice(0, 10)
      .map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeTeamLogo: m.homeTeam.crest,
        awayTeamLogo: m.awayTeam.crest,
        date: m.utcDate,
        status: m.status,
        matchday: m.matchday,
        venue: "",
        league: leagueName,
        leagueId,
      }));
  } catch (error) {
    console.error(`[fixtures] Error fetching ${leagueName}:`, error);
    return [];
  }
}

// Premier League: usa API-Football como fallback
async function getPremierLeagueFixtures(): Promise<Fixture[]> {
  // Primero intentar con Football-Data.org
  const fdFixtures = await getFootballDataFixtures(COMPETITIONS.PREMIER_LEAGUE, "Premier League", 39);
  if (fdFixtures.length > 0) return fdFixtures;

  // Fallback a API-Football
  if (!API_FOOTBALL_KEY) return [];

  try {
    const season = new Date().getFullYear();
    const url = `${API_FOOTBALL_BASE}/fixtures?league=39&season=${season}&status=NS&next=10`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": API_FOOTBALL_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.response || []).map((f: Record<string, unknown>) => {
      const fixture = f.fixture as Record<string, unknown>;
      const teams = f.teams as Record<string, Record<string, unknown>>;
      const league = f.league as Record<string, unknown>;
      const home = teams.home as Record<string, unknown>;
      const away = teams.away as Record<string, unknown>;
      const venue = fixture.venue as Record<string, unknown>;
      const status = fixture.status as Record<string, unknown>;
      return {
        id: fixture.id as number,
        homeTeam: home.name as string,
        awayTeam: away.name as string,
        homeTeamLogo: home.logo as string,
        awayTeamLogo: away.logo as string,
        date: fixture.date as string,
        status: status.short as string,
        matchday: league.round ? parseInt(String(league.round).replace(/\D/g, "")) || 0 : 0,
        venue: (venue.name as string) || "",
        league: "Premier League",
        leagueId: 39,
      };
    });
  } catch (error) {
    console.error("[fixtures] Error fetching Premier League:", error);
    return [];
  }
}

// La Liga: usa API-Football como fallback
async function getLaLigaFixtures(): Promise<Fixture[]> {
  const fdFixtures = await getFootballDataFixtures(COMPETITIONS.LA_LIGA, "La Liga", 140);
  if (fdFixtures.length > 0) return fdFixtures;

  if (!API_FOOTBALL_KEY) return [];

  try {
    const season = new Date().getFullYear();
    const url = `${API_FOOTBALL_BASE}/fixtures?league=140&season=${season}&status=NS&next=10`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": API_FOOTBALL_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.response || []).map((f: Record<string, unknown>) => {
      const fixture = f.fixture as Record<string, unknown>;
      const teams = f.teams as Record<string, Record<string, unknown>>;
      const league = f.league as Record<string, unknown>;
      const home = teams.home as Record<string, unknown>;
      const away = teams.away as Record<string, unknown>;
      const venue = fixture.venue as Record<string, unknown>;
      const status = fixture.status as Record<string, unknown>;
      return {
        id: fixture.id as number,
        homeTeam: home.name as string,
        awayTeam: away.name as string,
        homeTeamLogo: home.logo as string,
        awayTeamLogo: away.logo as string,
        date: fixture.date as string,
        status: status.short as string,
        matchday: league.round ? parseInt(String(league.round).replace(/\D/g, "")) || 0 : 0,
        venue: (venue.name as string) || "",
        league: "La Liga",
        leagueId: 140,
      };
    });
  } catch (error) {
    console.error("[fixtures] Error fetching La Liga:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get("league"); // "262", "140", "39" o "all"

  try {
    let fixtures: Fixture[] = [];

    if (league === "262" || league === "all" || !league) {
      const ligaMX = await getLigaMXFixtures();
      fixtures = [...fixtures, ...ligaMX];
    }

    if (league === "140" || league === "all" || !league) {
      const laLiga = await getLaLigaFixtures();
      fixtures = [...fixtures, ...laLiga];
    }

    if (league === "39" || league === "all" || !league) {
      const premier = await getPremierLeagueFixtures();
      fixtures = [...fixtures, ...premier];
    }

    return NextResponse.json({
      success: true,
      fixtures,
      sources: ["API-Football", "Football-Data.org"],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[fixtures] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error obteniendo fixtures" },
      { status: 500 }
    );
  }
}
