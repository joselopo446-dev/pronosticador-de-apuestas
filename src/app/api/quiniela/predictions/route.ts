// =============================================
// API — GENERAR PREDICCIONES PROFESIONALES
// =============================================
// POST /api/quiniela/predictions → Genera predicciones avanzadas

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { predictMatch, type MatchContext, type PredictionResult } from "@/lib/quiniela-predictor";

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

      // Verificar si ya existe predicción
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
        match_importance: 0.5,
        home_crowd_factor: 0.7,
        weather_impact: 0,
        referee_strictness: 0.5,
      };

      // Generar predicción profesional
      const prediction = await predictMatch(homeTeam, awayTeam, context);

      // Guardar en BD
      const { error } = await supabase.from("quiniela_predictions").upsert(
        {
          jornada: matchJornada || jornada,
          jornada_date: date,
          match_date: date,
          match_time: time,
          home_team: homeTeam,
          away_team: awayTeam,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          home_win_prob: prediction.home_win_prob,
          draw_prob: prediction.draw_prob,
          away_win_prob: prediction.away_win_prob,
          expected_home_goals: prediction.expected_home_goals,
          expected_away_goals: prediction.expected_away_goals,
          factor_team_state: prediction.factors.team_strength,
          factor_history: prediction.factors.h2h,
          factor_form: prediction.factors.form,
          factor_context: prediction.factors.context,
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
          prediction: prediction.prediction,
          confidence: Math.round(prediction.confidence * 100),
          probabilities: {
            home: Math.round(prediction.home_win_prob * 100),
            draw: Math.round(prediction.draw_prob * 100),
            away: Math.round(prediction.away_win_prob * 100),
          },
          goals: {
            expected_home: prediction.expected_home_goals,
            expected_away: prediction.expected_away_goals,
            over_2_5: Math.round(prediction.over_2_5_prob * 100),
            btts: Math.round(prediction.btts_yes_prob * 100),
          },
          likely_scores: prediction.likely_scores.slice(0, 3),
          factors: {
            elo_diff: prediction.factors.elo.diff,
            form_diff: prediction.factors.form.weighted_home - prediction.factors.form.weighted_away,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generadas ${generated} predicciones profesionales, ${skipped} omitidas`,
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
    const showAll = searchParams.get("showAll") === "true";

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from("quiniela_predictions")
      .select("*")
      .order("match_date", { ascending: true });

    // Si no se especifica jornada y no es admin, buscar la jornada actual
    if (!jornada && !showAll) {
      // Obtener la jornada más reciente de fixtures
      const { data: latestFixtures } = await supabase
        .from("quiniela_predictions")
        .select("jornada")
        .order("match_date", { ascending: false })
        .limit(1);

      if (latestFixtures && latestFixtures.length > 0) {
        query = query.eq("jornada", latestFixtures[0].jornada);
      }
    } else if (jornada) {
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
