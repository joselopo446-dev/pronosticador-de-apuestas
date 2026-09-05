// =============================================
// API — GENERAR PREDICCIONES DE QUINIELA
// =============================================
// POST /api/quiniela/predictions → Genera predicciones para una jornada

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { predictMatch, type MatchContext } from "@/lib/quiniela-predictor";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface MatchInput {
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  jornada: string;
  venue?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matches, jornada, forceGenerate } = body;

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json(
        { success: false, error: "Se requiere un array de partidos" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const results: any[] = [];
    let generated = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const match of matches) {
      const { homeTeam, awayTeam, date, time, jornada: matchJornada, venue } = match as MatchInput;

      // Verificar si ya existe predicción para este partido
      if (!forceGenerate) {
        const { data: existing } = await supabase
          .from("quiniela_predictions")
          .select("id")
          .eq("jornada", matchJornada || jornada)
          .eq("home_team", homeTeam)
          .eq("away_team", awayTeam)
          .single();

        if (existing) {
          skipped++;
          continue;
        }
      }

      // Contexto del partido
      const context: MatchContext = {
        is_playoff: false,
        must_win_home: false,
        must_win_away: false,
        home_needs_points: false,
        away_needs_points: false,
        rivalry_intensity: 0.5,
      };

      // Generar predicción
      const prediction = await predictMatch(homeTeam, awayTeam, context);

      // Determinar predicción final
      let predictionResult = "X";
      if (prediction.combined.home_win_prob > prediction.combined.away_win_prob &&
          prediction.combined.home_win_prob > prediction.combined.draw_prob) {
        predictionResult = "1";
      } else if (prediction.combined.away_win_prob > prediction.combined.home_win_prob &&
                 prediction.combined.away_win_prob > prediction.combined.draw_prob) {
        predictionResult = "2";
      }

      // Calcular confianza (la probabilidad más alta)
      const confidence = Math.max(
        prediction.combined.home_win_prob,
        prediction.combined.draw_prob,
        prediction.combined.away_win_prob
      );

      // Guardar en BD
      const { error } = await supabase.from("quiniela_predictions").upsert(
        {
          jornada: matchJornada || jornada,
          jornada_date: date,
          match_date: date,
          match_time: time,
          home_team: homeTeam,
          away_team: awayTeam,
          prediction: predictionResult,
          confidence,
          home_win_prob: prediction.combined.home_win_prob,
          draw_prob: prediction.combined.draw_prob,
          away_win_prob: prediction.combined.away_win_prob,
          expected_home_goals: prediction.combined.expected_home_goals,
          expected_away_goals: prediction.combined.expected_away_goals,
          factor_team_state: prediction.team_state,
          factor_history: prediction.history,
          factor_form: prediction.form,
          factor_context: prediction.context,
          status: "pending",
        },
        { onConflict: "jornada,home_team,away_team" }
      );

      if (error) {
        errors.push(`${homeTeam} vs ${awayTeam}: ${error.message}`);
      } else {
        generated++;
        results.push({
          match: `${homeTeam} vs ${awayTeam}`,
          prediction: predictionResult,
          confidence: Math.round(confidence * 100),
          probabilities: {
            home: Math.round(prediction.combined.home_win_prob * 100),
            draw: Math.round(prediction.combined.draw_prob * 100),
            away: Math.round(prediction.combined.away_win_prob * 100),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generadas ${generated} predicciones, ${skipped} omitidas`,
      generated,
      skipped,
      errors,
      predictions: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en POST /api/quiniela/predictions:", error);
    return NextResponse.json(
      { success: false, error: "Error generando predicciones" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jornada = searchParams.get("jornada");
    const status = searchParams.get("status") || "pending";

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from("quiniela_predictions")
      .select("*")
      .order("match_date", { ascending: true });

    if (jornada) {
      query = query.eq("jornada", jornada);
    }
    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      predictions: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error("Error en GET /api/quiniela/predictions:", error);
    return NextResponse.json(
      { success: false, error: "Error obteniendo predicciones" },
      { status: 500 }
    );
  }
}
