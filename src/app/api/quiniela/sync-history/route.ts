// =============================================
// API — SINCRONIZAR HISTORIAL DE PARTIDOS
// =============================================
// POST /api/quiniela/sync-history → Sincroniza historial desde TheSportsDB

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
  "América": "América",
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
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

async function fetchTeamHistory(teamId: string): Promise<any[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/${TSD_API_KEY}/eventslast.php?id=${teamId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching history for team ${teamId}:`, error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Sincronizando historial de partidos Liga MX...");

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const [teamName, teamId] of Object.entries(LIGA_MX_TEAMS)) {
      const events = await fetchTeamHistory(teamId);

      // Filtrar solo Liga MX
      const ligaMxEvents = events.filter(
        (e: any) =>
          e.strLeague === "Liga MX" ||
          e.idLeague === LEAGUE_ID
      );

      for (const event of ligaMxEvents) {
        try {
          const homeTeam = normalizeTeamName(event.strHomeTeam);
          const awayTeam = normalizeTeamName(event.strAwayTeam);
          const matchDate = event.dateEvent;
          const homeGoals = parseInt(event.intHomeScore) || 0;
          const awayGoals = parseInt(event.intAwayScore) || 0;
          const jornada = event.strRound || "";
          const season = event.strSeason || "";

          if (!homeTeam || !awayTeam || !matchDate) {
            totalSkipped++;
            continue;
          }

          const { error } = await supabase.from("match_history").upsert(
            {
              home_team: homeTeam,
              away_team: awayTeam,
              home_goals: homeGoals,
              away_goals: awayGoals,
              match_date: matchDate,
              jornada: jornada,
              season: season,
              tournament: "liga-mx",
              match_type: "liga-mx",
            },
            { onConflict: "home_team,away_team,match_date" }
          );

          if (error) {
            totalErrors++;
          } else {
            totalInserted++;
          }
        } catch (e) {
          totalErrors++;
        }
      }

      // Pausa para API
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Verificar total
    const { count } = await supabase
      .from("match_history")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      message: `Historial sincronizado: ${totalInserted} insertados, ${totalSkipped} omitidos, ${totalErrors} errores`,
      totalInserted,
      totalSkipped,
      totalErrors,
      totalInDb: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en POST /api/quiniela/sync-history:", error);
    return NextResponse.json(
      { success: false, error: "Error sincronizando historial" },
      { status: 500 }
    );
  }
}
