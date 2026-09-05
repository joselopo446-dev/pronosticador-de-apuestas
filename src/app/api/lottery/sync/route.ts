// =============================================
// API — SINCRONIZAR SORTEOS NUEVOS
// =============================================
// GET /api/lottery/sync — Busca y guarda sorteos nuevos de las 3 loterías
// Ejecutar cada 2 días via cron (Vercel Cron o externo)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LOTTERY_IDS: Record<string, string> = {
  melate: "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
  revancha: "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
  "super-lotto": "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
};

// Fuente: pronosticos.gob.mx API pública
async function fetchLatestDraws(lotteryName: string) {
  try {
    const response = await fetch(
      `https://www.pronosticos.gob.mx/api/v1/loterias/${lotteryName}/resultados?size=10`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.content || data || [];
  } catch {
    return [];
  }
}

export async function GET() {
  const results = {
    melate: { found: 0, inserted: 0 },
    revancha: { found: 0, inserted: 0 },
    "super-lotto": { found: 0, inserted: 0 },
  };

  for (const [slug, lotteryId] of Object.entries(LOTTERY_IDS)) {
    // Get latest draw number in DB
    const { data: latestDraw } = await supabase
      .from("lottery_draws")
      .select("draw_number")
      .eq("lottery_id", lotteryId)
      .order("draw_date", { ascending: false })
      .limit(1)
      .single();

    const latestNumber = latestDraw ? parseInt(latestDraw.draw_number) : 0;

    // Fetch new draws from external source
    const newDraws = await fetchLatestDraws(slug);
    results[slug as keyof typeof results].found = newDraws.length;

    // Filter and insert only newer draws
    const toInsert = newDraws
      .filter((d: any) => {
        const num = parseInt(d.consecutivo || d.drawNumber || d.numero);
        return num > latestNumber;
      })
      .map((d: any) => ({
        lottery_id: lotteryId,
        draw_number: String(d.consecutivo || d.drawNumber || d.numero),
        draw_date: d.fecha || d.drawDate || new Date().toISOString().split("T")[0],
        main_numbers: d.resultado || d.mainNumbers || [],
        bonus_number: d.adicional || d.bonusNumber || null,
        jackpot_amount: d.bote || d.jackpotAmount || null,
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("lottery_draws")
        .upsert(toInsert, { onConflict: "lottery_id,draw_date" });

      if (!error) {
        results[slug as keyof typeof results].inserted = toInsert.length;
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: "Sincronización completada",
    results,
    timestamp: new Date().toISOString(),
  });
}
