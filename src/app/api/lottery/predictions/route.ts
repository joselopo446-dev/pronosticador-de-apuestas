// =============================================
// API — GESTIONAR PREDICCIONES DE LOTERÍA
// =============================================
// GET  /api/lottery/predictions - Obtener predicciones
// POST /api/lottery/predictions - Crear predicciones automáticas
// POST /api/lottery/predictions/check - Verificar predicciones contra resultados

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LOTTERY_IDS: Record<string, string> = {
  melate: "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
  revancha: "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
  "super-lotto": "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
};

const LOTTERY_CONFIG: Record<string, { maxNum: number; count: number }> = {
  melate: { maxNum: 56, count: 6 },
  revancha: { maxNum: 56, count: 6 },
  "super-lotto": { maxNum: 45, count: 6 },
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =============================================
// GENERADOR DE PREDICCIONES MEJORADO
// =============================================

function calculateFrequency(draws: any[], maxNum: number) {
  const freq = new Map<number, number>();
  const recent = draws.slice(0, 30); // Últimos 30 sorteos
  
  for (let i = 1; i <= maxNum; i++) freq.set(i, 0);
  
  recent.forEach((draw) => {
    const nums = draw.main_numbers || [];
    nums.forEach((n: number) => freq.set(n, (freq.get(n) || 0) + 1));
  });
  
  return freq;
}

function getHotNumbers(freq: Map<number, number>, count: number): number[] {
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([num]) => num);
}

function getOverdueNumbers(draws: any[], maxNum: number, count: number): number[] {
  const lastSeen = new Map<number, number>();
  for (let i = 1; i <= maxNum; i++) lastSeen.set(i, draws.length);
  
  draws.forEach((draw, idx) => {
    const nums = draw.main_numbers || [];
    nums.forEach((n: number) => lastSeen.set(n, idx));
  });
  
  return Array.from(lastSeen.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([num]) => num);
}

function generatePrediction(
  draws: any[],
  maxNum: number,
  count: number,
  strategy: string,
  feedback?: { hotBoost: number; coldBoost: number; patternBoost: number }
): { numbers: number[]; confidence: number } {
  const freq = calculateFrequency(draws, maxNum);
  const fb = feedback || { hotBoost: 1, coldBoost: 1, patternBoost: 1 };
  
  let candidates: number[] = [];
  
  switch (strategy) {
    case "hot": {
      // Números calientes con peso
      const weighted: Array<[number, number]> = [];
      for (let i = 1; i <= maxNum; i++) {
        const weight = (freq.get(i) || 0) * fb.hotBoost;
        weighted.push([i, weight]);
      }
      weighted.sort((a, b) => b[1] - a[1]);
      candidates = weighted.slice(0, count * 2).map(([n]) => n);
      break;
    }
    case "overdue": {
      candidates = getOverdueNumbers(draws, maxNum, count * 3);
      break;
    }
    case "balanced": {
      const hot = getHotNumbers(freq, Math.ceil(count * 1.5));
      const cold = getOverdueNumbers(draws, maxNum, Math.ceil(count * 1.5));
      candidates = [...hot.slice(0, Math.ceil(count * 0.6)), ...cold.slice(0, Math.floor(count * 0.4))];
      break;
    }
    default: {
      // Ensemble
      const hot = getHotNumbers(freq, Math.ceil(count * 1.5));
      const cold = getOverdueNumbers(draws, maxNum, Math.ceil(count * 1.5));
      const balanced = [...hot.slice(0, 3), ...cold.slice(0, 3)];
      candidates = [...hot, ...cold, ...balanced];
    }
  }
  
  // Seleccionar números únicos
  const selected: number[] = [];
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  
  for (const num of shuffled) {
    if (selected.length >= count) break;
    if (!selected.includes(num)) selected.push(num);
  }
  
  // Completar si faltan
  while (selected.length < count) {
    const num = Math.floor(Math.random() * maxNum) + 1;
    if (!selected.includes(num)) selected.push(num);
  }
  
  selected.sort((a, b) => a - b);
  
  // Calcular confianza basada en historial
  const avgFreq = draws.length * count / maxNum;
  const matchedHot = selected.filter(n => (freq.get(n) || 0) > avgFreq).length;
  const confidence = Math.min(0.85, 0.4 + (matchedHot / count) * 0.3 + (draws.length / 500) * 0.15);
  
  return { numbers: selected, confidence };
}

// =============================================
// VERIFICAR PREDICCIONES
// =============================================

function checkPrediction(predicted: number[], actual: number[], bonusNumber: number | null) {
  const matched = predicted.filter(n => actual.includes(n));
  const matchedBonus = bonusNumber !== null && predicted.includes(bonusNumber);
  
  let prizeLevel = "";
  if (matched.length === 6) prizeLevel = "1er lugar - JACKPOT";
  else if (matched.length === 5 && matchedBonus) prizeLevel = "2do lugar";
  else if (matched.length === 5) prizeLevel = "3er lugar";
  else if (matched.length === 4 && matchedBonus) prizeLevel = "4to lugar";
  else if (matched.length === 4) prizeLevel = "5to lugar";
  else if (matched.length === 3 && matchedBonus) prizeLevel = "6to lugar";
  else if (matched.length === 3) prizeLevel = "7mo lugar";
  else if (matched.length === 2 && matchedBonus) prizeLevel = "8vo lugar";
  else if (matched.length === 2) prizeLevel = "9no lugar";
  
  return {
    matchedCount: matched.length,
    matchedBonus,
    prizeLevel,
  };
}

// =============================================
// HANDLERS
// =============================================

// GET — Obtener predicciones
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;
    const lotteryType = searchParams.get("type") || "melate";
    const status = searchParams.get("status") || "pending";
    const limit = parseInt(searchParams.get("limit") || "20");

    const lotteryId = LOTTERY_IDS[lotteryType];
    if (!lotteryId) {
      return NextResponse.json({ success: false, error: "Lotería no encontrada" }, { status: 400 });
    }

    // Get predictions with lottery info
    const { data: predictions, error } = await supabase
      .from("lottery_predictions")
      .select("*")
      .eq("lottery_id", lotteryId)
      .eq("status", status)
      .order("draw_date", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      predictions: predictions || [],
      total: predictions?.length || 0,
    });
  } catch (error) {
    console.error("[predictions] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Error obteniendo predicciones" },
      { status: 500 }
    );
  }
}

// POST — Generar predicciones para sorteos próximos
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json().catch(() => ({}));
    const lotteryType = body.type || "all";

    const results: Record<string, { generated: number; errors: string[] }> = {};

    for (const [slug, lotteryId] of Object.entries(LOTTERY_IDS)) {
      if (lotteryType !== "all" && lotteryType !== slug) continue;

      const config = LOTTERY_CONFIG[slug];
      results[slug] = { generated: 0, errors: [] };

      // Get historical draws
      const { data: draws } = await supabase
        .from("lottery_draws")
        .select("draw_number, draw_date, main_numbers, bonus_number")
        .eq("lottery_id", lotteryId)
        .order("draw_date", { ascending: false })
        .limit(500);

      if (!draws || draws.length === 0) {
        results[slug].errors.push("No hay datos históricos");
        continue;
      }

      // Calculate next draw dates
      const lastDrawDate = new Date(draws[0].draw_date);
      const nextDates: Date[] = [];
      
      // Melate: Wed, Fri, Sun. Revancha: same. Super Lotto: Tue, Thu, Sat
      const drawDays = slug === "super-lotto" ? [2, 4, 6] : [0, 3, 5]; // 0=Sun, 2=Tue, etc.
      
      const d = new Date(lastDrawDate);
      while (nextDates.length < 3) {
        d.setDate(d.getDate() + 1);
        if (drawDays.includes(d.getDay())) {
          nextDates.push(new Date(d));
        }
      }

      // Generate 2 predictions per strategy for each next draw
      const strategies = ["ensemble", "hot", "overdue", "balanced"];
      
      for (const nextDate of nextDates) {
        const drawNumber = String(parseInt(draws[0].draw_number) + nextDates.indexOf(nextDate) + 1);
        const dateStr = nextDate.toISOString().split("T")[0];

        // Get feedback from past predictions
        const { data: pastPredictions } = await supabase
          .from("lottery_predictions")
          .select("predicted_numbers, matched_numbers, status")
          .eq("lottery_id", lotteryId)
          .eq("status", "checked")
          .order("checked_at", { ascending: false })
          .limit(50);

        let feedback = { hotBoost: 1, coldBoost: 1, patternBoost: 1 };
        if (pastPredictions && pastPredictions.length > 0) {
          const avgMatch = pastPredictions.reduce((sum, p) => sum + (p.matched_numbers || 0), 0) / pastPredictions.length;
          if (avgMatch > 3) feedback.hotBoost = 1.2;
          else if (avgMatch < 2) feedback.coldBoost = 1.3;
        }

        // Generate 2 predictions with different strategies
        for (let i = 0; i < 2; i++) {
          const strategy = strategies[i % strategies.length];
          const prediction = generatePrediction(
            draws,
            config.maxNum,
            config.count,
            strategy,
            feedback
          );

          const { error } = await supabase
            .from("lottery_predictions")
            .upsert({
              lottery_id: lotteryId,
              draw_number: drawNumber,
              draw_date: dateStr,
              strategy,
              predicted_numbers: prediction.numbers,
              confidence: prediction.confidence,
              status: "pending",
            }, { onConflict: "lottery_id,draw_number,strategy" });

          if (error) {
            results[slug].errors.push(error.message);
          } else {
            results[slug].generated++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Predicciones generadas",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[predictions] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Error generando predicciones" },
      { status: 500 }
    );
  }
}
