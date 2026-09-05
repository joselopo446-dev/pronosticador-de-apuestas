// =============================================
// API — SORTEOS DE LOTERÍA
// =============================================
// GET  /api/lottery/draws?type=melate&limit=100 — Obtener sorteos
// POST /api/lottery/draws — Guardar nuevo sorteo

import { NextRequest, NextResponse } from "next/server";
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

// GET — Obtener sorteos
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;
    const lotteryType = searchParams.get("type") || "melate";
    const limit = parseInt(searchParams.get("limit") || "100");

    const lotteryId = LOTTERY_IDS[lotteryType];
    if (!lotteryId) {
      return NextResponse.json(
        { success: false, error: `Lotería '${lotteryType}' no encontrada` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("lottery_draws")
      .select("*")
      .eq("lottery_id", lotteryId)
      .order("draw_date", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      draws: data,
      total: data?.length || 0,
    });
  } catch (error) {
    console.error("[lottery-draws] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Error obteniendo sorteos" },
      { status: 500 }
    );
  }
}

// POST — Guardar sorteo manualmente
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const { lotteryType, drawNumber, drawDate, mainNumbers, bonusNumber, jackpotAmount } = body;

    if (!lotteryType || !drawNumber || !drawDate || !mainNumbers) {
      return NextResponse.json(
        { success: false, error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const lotteryId = LOTTERY_IDS[lotteryType];
    if (!lotteryId) {
      return NextResponse.json(
        { success: false, error: `Lotería '${lotteryType}' no encontrada` },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from("lottery_draws")
      .select("id")
      .eq("lottery_id", lotteryId)
      .eq("draw_number", drawNumber)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Sorteo ya existe",
        drawId: existing.id,
      });
    }

    // Insertar nuevo sorteo
    const { data, error } = await supabase
      .from("lottery_draws")
      .insert({
        lottery_id: lotteryId,
        draw_number: drawNumber,
        draw_date: drawDate,
        main_numbers: mainNumbers,
        bonus_number: bonusNumber,
        jackpot_amount: jackpotAmount,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Sorteo guardado exitosamente",
      draw: data,
    });
  } catch (error) {
    console.error("[lottery-draws] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Error guardando sorteo" },
      { status: 500 }
    );
  }
}
