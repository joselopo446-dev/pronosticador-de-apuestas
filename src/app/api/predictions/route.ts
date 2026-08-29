// =============================================
// API ROUTE — GENERAR PREDICCIÓN
// =============================================
// POST /api/predictions
// Recibe datos de un partido y retorna predicción Poisson.

import { NextRequest, NextResponse } from "next/server";
import { predictMatch, type PoissonInput } from "@/lib/models/poisson";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      homeTeamAttack,
      homeTeamDefense,
      awayTeamAttack,
      awayTeamDefense,
      homeAdvantage,
    } = body;

    // Validar parámetros
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

    const input: PoissonInput = {
      homeTeamAttack,
      homeTeamDefense,
      awayTeamAttack,
      awayTeamDefense,
      homeAdvantage: homeAdvantage ?? 1.3,
    };

    const result = predictMatch(input);

    return NextResponse.json({
      success: true,
      prediction: result,
      model: "poisson-v1",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Error al generar predicción" },
      { status: 500 }
    );
  }
}
