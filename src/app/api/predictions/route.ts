// =============================================
// API ROUTE — GENERAR PREDICCIÓN
// =============================================
// POST /api/predictions

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

    // Validar parámetros obligatorios
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

    // Validar rangos (0-2 para attack/defense)
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

    return NextResponse.json({
      success: true,
      prediction: result,
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
