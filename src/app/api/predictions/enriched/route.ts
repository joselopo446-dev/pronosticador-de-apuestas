// =============================================
// API ROUTE — PREDICCIÓN ENRIQUECIDA
// =============================================
// POST /api/predictions/enriched
// Usa datos de múltiples APIs para mejores predicciones

import { NextRequest, NextResponse } from "next/server";
import { getEnrichedMatchData } from "@/lib/enriched-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeTeamName, homeTeamId, awayTeamName, awayTeamId, leagueId } = body;

    if (!homeTeamName || !awayTeamName) {
      return NextResponse.json(
        { error: "Se requieren homeTeamName y awayTeamName" },
        { status: 400 }
      );
    }

    // Obtener datos enriquecidos de múltiples fuentes
    const enriched = await getEnrichedMatchData(
      homeTeamName,
      homeTeamId || 0,
      awayTeamName,
      awayTeamId || 0,
      leagueId || 0
    );

    return NextResponse.json({
      success: true,
      ...enriched,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Enriched prediction error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
