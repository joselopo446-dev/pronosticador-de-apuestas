// =============================================
// API ROUTE — GENERAR PREDICCIÓN + GUARDAR EN DB
// =============================================
// POST /api/predictions
// GET  /api/predictions — historial

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { predictMatch, type PoissonInput } from "@/lib/models/poisson";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      homeTeamAttack,
      homeTeamDefense,
      awayTeamAttack,
      awayTeamDefense,
      homeAdvantage,
      homeTeamId,
      awayTeamId,
      matchId,
    } = body;

    if (
      typeof homeTeamAttack !== "number" ||
      typeof homeTeamDefense !== "number" ||
      typeof awayTeamAttack !== "number" ||
      typeof awayTeamDefense !== "number"
    ) {
      return NextResponse.json(
        { error: "Faltan parámetros obligatorios" },
        { status: 400 }
      );
    }

    const validateRange = (v: number, name: string) => {
      if (v < 0 || v > 2) throw new Error(`${name} debe estar entre 0 y 2`);
    };
    validateRange(homeTeamAttack, "homeTeamAttack");
    validateRange(homeTeamDefense, "homeTeamDefense");
    validateRange(awayTeamAttack, "awayTeamAttack");
    validateRange(awayTeamDefense, "awayTeamDefense");

    if (homeAdvantage !== undefined && (homeAdvantage < 1 || homeAdvantage > 2)) {
      return NextResponse.json(
        { error: "homeAdvantage debe estar entre 1 y 2" },
        { status: 400 }
      );
    }

    const input: PoissonInput = {
      homeTeamAttack,
      homeTeamDefense,
      awayTeamAttack,
      awayTeamDefense,
      homeAdvantage: homeAdvantage ?? 1.3,
    };

    const result = predictMatch(input);

    // Guardar predicción en Supabase si se enviaron IDs
    let savedId: string | null = null;
    if (homeTeamId && awayTeamId) {
      const { data, error } = await supabase
        .from("predictions")
        .insert({
          match_id: matchId || null,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          model_used: "poisson-v1",
          home_win_prob: result.probabilities.homeWin,
          draw_prob: result.probabilities.draw,
          away_win_prob: result.probabilities.awayWin,
          expected_home_goals: result.expectedHomeGoals,
          expected_away_goals: result.expectedAwayGoals,
          predicted_score_home: result.mostLikelyScore.home,
          predicted_score_away: result.mostLikelyScore.away,
          over25_prob: result.overUnder.over25,
          under25_prob: result.overUnder.under25,
          btts_yes_prob: result.btts.yes,
          btts_no_prob: result.btts.no,
          explanation: result.explanation,
        })
        .select("id")
        .single();

      if (!error && data) savedId = data.id;
    }

    return NextResponse.json({
      success: true,
      prediction: result,
      predictionId: savedId,
      model: "poisson-v1",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Prediction error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error, count } = await supabase
      .from("predictions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      predictions: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
