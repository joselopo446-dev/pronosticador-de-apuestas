// =============================================
// API — JORNADAS LIGA MX (DESDE BD)
// =============================================
// GET /api/football/jornadas → Obtiene jornadas desde Supabase
// POST /api/football/jornadas → Actualiza horarios desde TheSportsDB

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// TheSportsDB Liga MX team IDs
const LIGA_MX_TEAMS: Record<string, number> = {
  América: 134193,
  "Cruz Azul": 134196,
  Guadalajara: 134205,
  Monterrey: 134198,
  "Tigres UANL": 134197,
  "Pumas UNAM": 134201,
  León: 134207,
  "Santos Laguna": 134192,
  Toluca: 134204,
  Pachuca: 134191,
  Atlas: 134195,
  Puebla: 134199,
  Necaxa: 134194,
  "San Luis": 134202,
  Mazatlán: 47810,
  Juárez: 134200,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jornada = searchParams.get("jornada");
    const current = searchParams.get("current") === "true";

    let query = supabase
      .from("liga_mx_jornadas")
      .select("*")
      .order("jornada_number", { ascending: true })
      .order("match_index", { ascending: true });

    if (current) {
      // Obtener jornada actual
      const { data: currentData } = await supabase.rpc("get_current_jornada");
      if (currentData) {
        query = query.eq("jornada_number", currentData);
      }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jornada, force } = body;

    // Verificar si ya tiene horarios
    const { data: existing } = await supabase
      .from("liga_mx_jornadas")
      .select("match_date")
      .eq("jornada_number", jornada || 7)
      .not("match_date", "is", null)
      .limit(1);

    if (existing && existing.length > 0 && !force) {
      return NextResponse.json({
        success: true,
        message: "Jornada ya tiene horarios asignados",
        cached: true,
      });
    }

    // Obtener próximos partidos de TheSportsDB
    const allFixtures: any[] = [];

    for (const [teamName, teamId] of Object.entries(LIGA_MX_TEAMS)) {
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`
        );
        const data = await response.json();

        if (data.events) {
          for (const event of data.events) {
            if (event.strLeague === "Liga MX" || event.idLeague === "4350") {
              // Buscar si este partido ya está en la BD
              const { data: existingMatch } = await supabase
                .from("liga_mx_jornadas")
                .select("id")
                .eq("home_team", event.strHomeTeam)
                .eq("away_team", event.strAwayTeam)
                .is("match_date", null)
                .limit(1);

              if (existingMatch && existingMatch.length > 0) {
                // Actualizar horario
                await supabase
                  .from("liga_mx_jornadas")
                  .update({
                    match_date: event.dateEvent,
                    match_time: event.strTime || "00:00",
                    venue: event.strVenue || "",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", existingMatch[0].id);

                allFixtures.push({
                  homeTeam: event.strHomeTeam,
                  awayTeam: event.strAwayTeam,
                  date: event.dateEvent,
                  time: event.strTime,
                });
              }
            }
          }
        }
      } catch (e) {
        console.error(`Error fetching for ${teamName}:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Actualizados ${allFixtures.length} horarios`,
      fixtures: allFixtures,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en POST /api/football/jornadas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
