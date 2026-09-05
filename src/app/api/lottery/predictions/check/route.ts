// =============================================
// API — VERIFICAR PREDICCIONES vs RESULTADOS
// =============================================
// POST /api/lottery/predictions/check — Compara predicciones con sorteos reales

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LOTTERY_IDS: Record<string, string> = {
  melate: "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
  revancha: "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
  "super-lotto": "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  try {
    const supabase = getSupabase();
    let totalChecked = 0;
    let totalWon = 0;

    for (const [slug, lotteryId] of Object.entries(LOTTERY_IDS)) {
      // Get pending predictions
      const { data: predictions } = await supabase
        .from("lottery_predictions")
        .select("id, draw_number, draw_date, predicted_numbers, strategy")
        .eq("lottery_id", lotteryId)
        .eq("status", "pending");

      if (!predictions || predictions.length === 0) continue;

      for (const pred of predictions) {
        // Find matching draw result
        const { data: draw } = await supabase
          .from("lottery_draws")
          .select("main_numbers, bonus_number")
          .eq("lottery_id", lotteryId)
          .eq("draw_number", pred.draw_number)
          .single();

        if (!draw) continue; // Draw hasn't happened yet

        // Compare numbers
        const predicted = pred.predicted_numbers;
        const actual = draw.main_numbers;
        const bonusNumber = draw.bonus_number;

        const matchedNumbers = predicted.filter((n: number) => actual.includes(n));
        const matchedBonus = bonusNumber !== null && predicted.includes(bonusNumber);

        let prizeLevel = "";
        let status = "lost";
        
        if (matchedNumbers.length === 6) { prizeLevel = "JACKPOT"; status = "won"; }
        else if (matchedNumbers.length === 5 && matchedBonus) prizeLevel = "2do lugar";
        else if (matchedNumbers.length === 5) prizeLevel = "3er lugar";
        else if (matchedNumbers.length === 4 && matchedBonus) prizeLevel = "4to lugar";
        else if (matchedNumbers.length === 4) prizeLevel = "5to lugar";
        else if (matchedNumbers.length === 3 && matchedBonus) prizeLevel = "6to lugar";
        else if (matchedNumbers.length === 3) prizeLevel = "7mo lugar";
        else if (matchedNumbers.length === 2 && matchedBonus) prizeLevel = "8vo lugar";
        else if (matchedNumbers.length === 2) prizeLevel = "9no lugar";

        // Update prediction
        const { error } = await supabase
          .from("lottery_predictions")
          .update({
            matched_numbers: matchedNumbers.length,
            matched_bonus: matchedBonus,
            prize_level: prizeLevel,
            status: status === "won" ? "won" : "checked",
            checked_at: new Date().toISOString(),
          })
          .eq("id", pred.id);

        if (!error) {
          totalChecked++;
          if (status === "won") totalWon++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${totalChecked} predicciones verificadas, ${totalWon} ganadoras`,
      totalChecked,
      totalWon,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[predictions-check] error:", error);
    return NextResponse.json(
      { success: false, error: "Error verificando predicciones" },
      { status: 500 }
    );
  }
}
