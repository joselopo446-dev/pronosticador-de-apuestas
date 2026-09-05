// =============================================
// API — PRONÓSTICOS CACHEADOS (1 VEZ AL DÍA)
// =============================================
// GET /api/quiniela/predictions/daily → Obtiene pronósticos del día
// POST /api/quiniela/predictions/daily → Genera pronósticos (1 vez al día)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { predictMatch } from "@/lib/quiniela-predictor";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jornada = searchParams.get("jornada");
    const forceGenerate = searchParams.get("force") === "true";

    // Fecha de hoy
    const today = new Date().toISOString().split("T")[0];

    // 1. Verificar si ya hay pronósticos para hoy
    const { data: existingPredictions, error: fetchError } = await supabase
      .from("quiniela_daily_predictions")
      .select("*")
      .eq("prediction_date", today)
      .order("match_index", { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // Si ya hay pronósticos hoy y no se fuerza regenerar
    if (existingPredictions && existingPredictions.length > 0 && !forceGenerate) {
      const formatted = existingPredictions.map((p) => ({
        id: p.id,
        jornada: p.jornada_number,
        match_index: p.match_index,
        home_team: p.home_team,
        away_team: p.away_team,
        prediction: p.prediction,
        confidence: p.confidence,
        home_win_prob: p.home_win_prob,
        draw_prob: p.draw_prob,
        away_win_prob: p.away_win_prob,
        expected_home_goals: p.expected_home_goals,
        expected_away_goals: p.expected_away_goals,
        factor_team_state: p.factor_team_state,
        factor_history: p.factor_history,
        factor_form: p.factor_form,
        factor_context: p.factor_context,
        status: p.status,
      }));

      return NextResponse.json({
        success: true,
        predictions: formatted,
        total: formatted.length,
        source: "cache_diario",
        date: today,
        message: "Pronósticos del día (generados una vez)",
      });
    }

    // 2. Si no hay pronósticos, generarlos
    return await generateDailyPredictions(today, jornada);
  } catch (error: any) {
    console.error("Error en GET /api/quiniela/predictions/daily:", error);
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

    const today = new Date().toISOString().split("T")[0];

    // Verificar si ya existen pronósticos hoy
    if (!force) {
      const { data: existing } = await supabase
        .from("quiniela_daily_predictions")
        .select("id")
        .eq("prediction_date", today)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          message: "Ya existen pronósticos para hoy",
          cached: true,
        });
      }
    }

    return await generateDailyPredictions(today, jornada);
  } catch (error: any) {
    console.error("Error en POST /api/quiniela/predictions/daily:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function generateDailyPredictions(today: string, jornada?: string | null) {
  // 1. Obtener jornada actual de la BD
  let jornadaNumber = jornada ? parseInt(jornada) : null;

  if (!jornadaNumber) {
    const { data: currentJornada } = await supabase.rpc("get_current_jornada");
    jornadaNumber = currentJornada || 7;
  }

  // 2. Obtener partidos de la jornada desde BD
  const { data: matches, error: matchesError } = await supabase
    .from("liga_mx_jornadas")
    .select("*")
    .eq("jornada_number", jornadaNumber)
    .order("match_index", { ascending: true });

  if (matchesError || !matches || matches.length === 0) {
    return NextResponse.json(
      { success: false, error: "No se encontraron partidos para esta jornada" },
      { status: 404 }
    );
  }

  // 3. Generar predicciones para cada partido
  const predictions: any[] = [];
  const errors: string[] = [];

  for (const match of matches) {
    try {
      // Contexto básico del partido
      const context = {
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

      // Generar predicción
      const prediction = await predictMatch(match.home_team, match.away_team, context);

      // Guardar en caché diario
      const { error: insertError } = await supabase
        .from("quiniela_daily_predictions")
        .upsert(
          {
            prediction_date: today,
            jornada_number: match.jornada_number,
            match_index: match.match_index,
            home_team: match.home_team,
            away_team: match.away_team,
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
            status: "active",
          },
          { onConflict: "prediction_date,jornada_number,match_index" }
        );

      if (insertError) {
        errors.push(`${match.home_team} vs ${match.away_team}: ${insertError.message}`);
      } else {
        predictions.push({
          id: predictions.length + 1,
          jornada: match.jornada_number,
          match_index: match.match_index,
          home_team: match.home_team,
          away_team: match.away_team,
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
          status: "active",
        });
      }
    } catch (e: any) {
      errors.push(`${match.home_team} vs ${match.away_team}: ${e.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    predictions,
    total: predictions.length,
    errors,
    jornada: jornadaNumber,
    date: today,
    source: "generado_hoy",
    message: `Pronósticos generados para Jornada ${jornadaNumber} (${predictions.length} partidos)`,
  });
}
