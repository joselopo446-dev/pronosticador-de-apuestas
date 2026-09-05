// =============================================
// API — VERIFICAR PREDICCIONES DE QUINIELA
// =============================================
// POST /api/quiniela/check → Verifica predicciones vs resultados reales

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { jornada } = body;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener predicciones pendientes
    let query = supabase
      .from("quiniela_predictions")
      .select("*")
      .eq("status", "pending");

    if (jornada) {
      query = query.eq("jornada", jornada);
    }

    const { data: predictions, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!predictions || predictions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay predicciones pendientes para verificar",
        totalChecked: 0,
        totalWon: 0,
      });
    }

    let totalChecked = 0;
    let totalWon = 0;
    const checkedMatches: any[] = [];

    // Para cada predicción, buscar el resultado real en match_history
    for (const pred of predictions) {
      // Buscar el partido en el historial
      const { data: matchResult } = await supabase
        .from("match_history")
        .select("*")
        .eq("home_team", pred.home_team)
        .eq("away_team", pred.away_team)
        .eq("match_date", pred.match_date)
        .single();

      if (!matchResult) continue;

      // Determinar resultado real
      let actualResult = "X";
      if (matchResult.home_goals > matchResult.away_goals) actualResult = "1";
      else if (matchResult.home_goals < matchResult.away_goals) actualResult = "2";

      const isCorrect = actualResult === pred.prediction;

      // Actualizar predicción
      const { error: updateError } = await supabase
        .from("quiniela_predictions")
        .update({
          actual_result: actualResult,
          actual_home_goals: matchResult.home_goals,
          actual_away_goals: matchResult.away_goals,
          is_correct: isCorrect,
          status: isCorrect ? "won" : "lost",
          checked_at: new Date().toISOString(),
        })
        .eq("id", pred.id);

      if (!updateError) {
        totalChecked++;
        if (isCorrect) totalWon++;

        checkedMatches.push({
          match: `${pred.home_team} vs ${pred.away_team}`,
          prediction: pred.prediction,
          actual: actualResult,
          correct: isCorrect,
          score: `${matchResult.home_goals}-${matchResult.away_goals}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verificadas ${totalChecked} predicciones, ${totalWon} ganadoras`,
      totalChecked,
      totalWon,
      accuracy: totalChecked > 0 ? Math.round((totalWon / totalChecked) * 100) : 0,
      checkedMatches,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en POST /api/quiniela/check:", error);
    return NextResponse.json(
      { success: false, error: "Error verificando predicciones" },
      { status: 500 }
    );
  }
}
