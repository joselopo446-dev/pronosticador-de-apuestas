// =============================================
// API — SYNC MASIVO DE DATOS
// =============================================
// POST /api/quiniela/sync-mass → Sync completo desde múltiples fuentes

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TSD_API_KEY = "3";
const LEAGUE_ID = "4350";

const LIGA_MX_TEAMS: Record<string, string> = {
  "América": "134193",
  "Cruz Azul": "134196",
  "Guadalajara": "134205",
  "Monterrey": "134198",
  "Tigres UANL": "134197",
  "Pumas UNAM": "134201",
  "León": "134207",
  "Santos Laguna": "134192",
  "Toluca": "134204",
  "Pachuca": "134191",
  "Atlas": "134195",
  "Puebla": "134199",
  "Necaxa": "134194",
  "San Luis": "134202",
  "Mazatlán": "47810",
  "Juárez": "134200",
};

const TEAM_NAME_MAP: Record<string, string> = {
  "Club América": "América",
  "Cruz Azul": "Cruz Azul",
  "CD Guadalajara": "Guadalajara",
  "Guadalajara": "Guadalajara",
  "Chivas": "Guadalajara",
  "Monterrey": "Monterrey",
  "Rayados": "Monterrey",
  "Tigres UANL": "Tigres UANL",
  "Tigres": "Tigres UANL",
  "Pumas UNAM": "Pumas UNAM",
  "Pumas": "Pumas UNAM",
  "Club León": "León",
  "León": "León",
  "Santos Laguna": "Santos Laguna",
  "Santos": "Santos Laguna",
  "Deportivo Toluca": "Toluca",
  "Toluca": "Toluca",
  "Club Pachuca": "Pachuca",
  "Pachuca": "Pachuca",
  "Atlas": "Atlas",
  "Club Atlas": "Atlas",
  "Club Puebla": "Puebla",
  "Puebla": "Puebla",
  "Necaxa": "Necaxa",
  "Club Necaxa": "Necaxa",
  "San Luis": "San Luis",
  "Atlético San Luis": "San Luis",
  "Mazatlán": "Mazatlán",
  "FC Juárez": "Juárez",
  "Juárez": "Juárez",
  "Atlante": "Atlante",
  "Chiapas": "Chiapas",
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

async function fetchTSDHistory(teamId: string): Promise<any[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/${TSD_API_KEY}/eventslast.php?id=${teamId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

async function fetchTSDSeason(teamId: string, season: string): Promise<any[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/${TSD_API_KEY}/eventsseason.php?id=${teamId}&s=${season}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.events || [];
  } catch {
    return [];
  }
}

async function fetchAPIFootballHistory(teamName: string): Promise<any[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return [];

  // Buscar ID del equipo en API-Football
  const searchUrl = `https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(teamName)}`;
  try {
    const searchRes = await fetch(searchUrl, {
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
    });
    const searchData = await searchRes.json();
    
    if (!searchData.response || searchData.response.length === 0) return [];
    
    const teamId = searchData.response[0].team.id;
    
    // Obtener últimos 50 partidos
    const fixturesUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${teamId}&last=50&league=262`;
    const fixturesRes = await fetch(fixturesUrl, {
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
    });
    const fixturesData = await fixturesRes.json();
    
    return fixturesData.response || [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("🔄 SYNC MASIVO INICIADO");

    let totalInserted = 0;
    let totalErrors = 0;
    const teamStats: Record<string, number> = {};

    for (const [teamName, teamId] of Object.entries(LIGA_MX_TEAMS)) {
      console.log(`Procesando: ${teamName}`);

      // Obtener datos de múltiples fuentes
      const [tsdRecent, tsdSeason] = await Promise.all([
        fetchTSDHistory(teamId),
        fetchTSDSeason(teamId, "2026"),
      ]);

      // Combinar eventos
      const allEvents = new Map<string, any>();

      // TheSportsDB recientes
      for (const event of tsdRecent) {
        if (event.strLeague === "Liga MX" || event.idLeague === LEAGUE_ID) {
          allEvents.set(event.idEvent, event);
        }
      }

      // TheSportsDB temporada
      for (const event of tsdSeason) {
        if (event.strLeague === "Liga MX" || event.idLeague === LEAGUE_ID) {
          allEvents.set(event.idEvent, event);
        }
      }

      // Insertar en BD
      let insertedCount = 0;
      for (const event of allEvents.values()) {
        try {
          const homeTeam = normalizeTeamName(event.strHomeTeam);
          const awayTeam = normalizeTeamName(event.strAwayTeam);
          const matchDate = event.dateEvent;
          const homeGoals = parseInt(event.intHomeScore) || 0;
          const awayGoals = parseInt(event.intAwayScore) || 0;

          if (!homeTeam || !awayTeam || !matchDate) continue;

          const { error } = await supabase.from("match_history").upsert(
            {
              home_team: homeTeam,
              away_team: awayTeam,
              home_goals: homeGoals,
              away_goals: awayGoals,
              match_date: matchDate,
              jornada: event.strRound || "",
              season: event.strSeason || "",
              tournament: "liga-mx",
              match_type: "liga-mx",
            },
            { onConflict: "home_team,away_team,match_date" }
          );

          if (!error) {
            insertedCount++;
            totalInserted++;
          } else {
            totalErrors++;
          }
        } catch (e) {
          totalErrors++;
        }
      }

      teamStats[teamName] = insertedCount;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Verificar total
    const { count } = await supabase
      .from("match_history")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      message: `Sync completado: ${totalInserted} insertados, ${totalErrors} errores`,
      totalInserted,
      totalErrors,
      totalInDb: count,
      teamStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en sync masivo:", error);
    return NextResponse.json(
      { success: false, error: "Error en sync masivo" },
      { status: 500 }
    );
  }
}
