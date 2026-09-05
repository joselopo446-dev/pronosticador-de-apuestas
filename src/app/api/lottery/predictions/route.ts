// =============================================
// API — PREDICCIONES DE LOTERÍA EXPERTAS
// =============================================
// POST /api/lottery/predictions → Genera predicciones de nivel experto

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generatePrediction } from "@/lib/lottery-predictor";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const LOTTERY_IDS: Record<string, string> = {
  melate: "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
  revancha: "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
  "super-lotto": "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
};

const EXPERT_STRATEGIES = [
  { id: "ensemble", name: "Ensemble Experto", description: "Combina las 7 estrategias y usa votación" },
  { id: "expert-balance", name: "Balance de Familias", description: "Distribuye entre rangos numéricos" },
  { id: "delta-optimal", name: "Deltas Óptimos", description: "Usa patrones de diferencia entre números" },
  { id: "positional-expert", name: "Análisis Posicional", description: "Números óptimos por posición" },
  { id: "sum-optimal", name: "Suma Óptima", description: "Busca la suma ideal de 130-140" },
  { id: "hot-cold-balance", name: "Balance Caliente/Frío", description: "60% calientes, 40% fríos" },
  { id: "prime-fibonacci", name: "Primos y Fibonacci", description: "Números especiales matemáticos" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, strategy = "ensemble", forceGenerate } = body;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determinar qué loterías procesar
    const lotteryTypes = type === "all" 
      ? Object.keys(LOTTERY_IDS) 
      : [type].filter(t => LOTTERY_IDS[t]);

    const results: Record<string, any> = {};

    for (const lotteryType of lotteryTypes) {
      const lotteryId = LOTTERY_IDS[lotteryType];
      if (!lotteryId) continue;

      console.log(`Generando predicciones expertas para ${lotteryType}...`);

      // Obtener historial de la BD
      const { data: draws, error: drawsError } = await supabase
        .from("lottery_draws")
        .select("*")
        .eq("lottery_id", lotteryId)
        .order("draw_date", { ascending: false })
        .limit(200);

      if (drawsError || !draws || draws.length < 10) {
        results[lotteryType] = { generated: 0, error: "Datos insuficientes" };
        continue;
      }

      // Obtener próximo sorteo
      const { data: lastDraw } = await supabase
        .from("lottery_draws")
        .select("draw_number")
        .eq("lottery_id", lotteryId)
        .order("draw_number", { ascending: false })
        .limit(1)
        .single();

      const nextDrawNumber = lastDraw ? parseInt(lastDraw.draw_number) + 1 : 4262;

      // Calcular fecha del próximo sorteo (L/Mi/V para Melate, L/M/J para Super Lotto)
      const drawSchedule = lotteryType === "super-lotto" 
        ? [1, 3, 5] // Lun, Mié, Vie
        : [1, 2, 4]; // Lun, Mar, Jue (Melate/Revancha)
      
      const today = new Date();
      let nextDrawDate = new Date(today);
      nextDrawDate.setDate(nextDrawDate.getDate() + 1);
      
      while (!drawSchedule.includes(nextDrawDate.getDay())) {
        nextDrawDate.setDate(nextDrawDate.getDate() + 1);
      }

      const generated: any[] = [];
      const errors: string[] = [];

      // Generar 3 predicciones con diferentes estrategias
      const strategiesToUse = strategy === "ensemble" 
        ? ["ensemble", "expert-balance", "delta-optimal"]
        : [strategy];

      for (const strat of strategiesToUse) {
        try {
          // Verificar si ya existe predicción
          if (!forceGenerate) {
            const { data: existing } = await supabase
              .from("lottery_predictions")
              .select("id")
              .eq("lottery_id", lotteryId)
              .eq("draw_number", String(nextDrawNumber))
              .eq("strategy", strat)
              .single();

            if (existing) continue;
          }

          // Generar predicción experta
          const prediction = generatePrediction(draws, strat, lotteryType);

          // Guardar en BD
          const { error: insertError } = await supabase
            .from("lottery_predictions")
            .upsert({
              lottery_id: lotteryId,
              draw_number: String(nextDrawNumber),
              draw_date: nextDrawDate.toISOString().split("T")[0],
              strategy: strat,
              predicted_numbers: prediction.numbers,
              confidence: prediction.confidence,
              matched_numbers: 0,
              matched_bonus: false,
              prize_level: "",
              status: "pending",
            }, { onConflict: "lottery_id,draw_number,strategy" });

          if (insertError) {
            errors.push(`${strat}: ${insertError.message}`);
          } else {
            generated.push({
              strategy: strat,
              numbers: prediction.numbers,
              confidence: Math.round(prediction.confidence * 100),
              factors: prediction.factors.slice(0, 3),
            });
          }
        } catch (e: any) {
          errors.push(`${strat}: ${e.message}`);
        }
      }

      results[lotteryType] = {
        generated: generated.length,
        errors,
        predictions: generated,
        nextDraw: {
          number: nextDrawNumber,
          date: nextDrawDate.toISOString().split("T")[0],
        },
      };
    }

    return NextResponse.json({
      success: true,
      message: "Predicciones expertas generadas",
      results,
      strategies: EXPERT_STRATEGIES,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en POST /api/lottery/predictions:", error);
    return NextResponse.json(
      { success: false, error: "Error generando predicciones expertas" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "melate";
    const status = searchParams.get("status") || "pending";

    const supabase = createClient(supabaseUrl, supabaseKey);
    const lotteryId = LOTTERY_IDS[type];

    if (!lotteryId) {
      return NextResponse.json(
        { success: false, error: "Tipo de lotería no válido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("lottery_predictions")
      .select("*")
      .eq("lottery_id", lotteryId)
      .eq("status", status)
      .order("draw_date", { ascending: false })
      .limit(20);

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
      strategies: EXPERT_STRATEGIES,
    });
  } catch (error) {
    console.error("Error en GET /api/lottery/predictions:", error);
    return NextResponse.json(
      { success: false, error: "Error obteniendo predicciones" },
      { status: 500 }
    );
  }
}
