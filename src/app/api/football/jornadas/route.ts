// =============================================
// API — JORNADAS MULTI-LIGA (DESDE BD)
// =============================================
// GET /api/football/jornadas → Obtiene jornadas desde Supabase
// GET /api/football/jornadas?league=premier → Premier League
// GET /api/football/jornadas?league=laliga → La Liga
// GET /api/football/jornadas?league=liga-mx → Liga MX (default)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const LEAGUE_TABLES: Record<string, string> = {
  "liga-mx": "liga_mx_jornadas",
  "premier": "premier_jornadas",
  "laliga": "laliga_jornadas",
};

const LEAGUE_RPC: Record<string, string> = {
  "liga-mx": "get_current_jornada",
  "premier": "get_current_jornada_by_league",
  "laliga": "get_current_jornada_by_league",
};

// Fechas de inicio de temporada por liga (temporada 2026-2027)
const LEAGUE_SEASON_START: Record<string, string> = {
  "liga-mx": "2026-07-12",
  "premier": "2026-08-16",
  "laliga": "2026-08-17",
};

const LEAGUE_JORNADAS_PER_SEASON: Record<string, number> = {
  "liga-mx": 17,
  "premier": 38,
  "laliga": 38,
};

function calculateCurrentJornada(league: string): number {
  const startDate = LEAGUE_SEASON_START[league];
  const totalJornadas = LEAGUE_JORNADAS_PER_SEASON[league] || 17;
  
  if (!startDate) return 1;
  
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 1;
  
  const jornada = Math.floor(diffDays / 7) + 1;
  return Math.min(jornada, totalJornadas);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jornada = searchParams.get("jornada");
    const current = searchParams.get("current") === "true";
    const league = searchParams.get("league") || "liga-mx";
    const table = LEAGUE_TABLES[league] || "liga_mx_jornadas";

    let query = supabase
      .from(table)
      .select("*")
      .order("jornada_number", { ascending: true })
      .order("match_index", { ascending: true });

    if (current) {
      const jornadaNumber = calculateCurrentJornada(league);
      query = query.eq("jornada_number", jornadaNumber);
    } else if (jornada) {
      query = query.eq("jornada_number", parseInt(jornada));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Agrupar por jornada
    const jornadas: Record<number, any[]> = {};
    for (const match of data || []) {
      if (!jornadas[match.jornada_number]) {
        jornadas[match.jornada_number] = [];
      }
      jornadas[match.jornada_number].push({
        id: match.id,
        matchIndex: match.match_index,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        date: match.match_date,
        time: match.match_time,
        venue: match.venue,
        status: match.status,
        homeGoals: match.home_goals,
        awayGoals: match.away_goals,
      });
    }

    return NextResponse.json({
      success: true,
      league,
      jornadas: Object.entries(jornadas).map(([num, matches]) => ({
        jornada: parseInt(num),
        matches,
        totalMatches: matches.length,
      })),
      total: data?.length || 0,
    });
  } catch (error: any) {
    console.error("Error en GET /api/football/jornadas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
