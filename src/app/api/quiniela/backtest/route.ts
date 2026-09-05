// =============================================
// API — BACKTESTING Y OPTIMIZACIÓN
// =============================================
// POST /api/quiniela/backtest → Ejecuta backtest del modelo
// POST /api/quiniela/optimize → Optimiza pesos del modelo

import { NextRequest, NextResponse } from "next/server";
import { runBacktest, optimizeWeights } from "@/lib/backtesting";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, startDate, endDate } = body;

    if (action === "backtest") {
      console.log("🔄 Ejecutando backtest...");
      const result = await runBacktest(startDate, endDate);
      
      return NextResponse.json({
        success: true,
        result,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "optimize") {
      console.log("🔄 Optimizando pesos del modelo...");
      const results = await optimizeWeights();
      
      return NextResponse.json({
        success: true,
        topWeights: results.slice(0, 5),
        bestAccuracy: results[0]?.accuracy || 0,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en backtest:", error);
    return NextResponse.json(
      { success: false, error: "Error ejecutando backtest" },
      { status: 500 }
    );
  }
}
