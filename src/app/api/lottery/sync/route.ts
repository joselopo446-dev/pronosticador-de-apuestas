// =============================================
// API — SINCRONIZAR SORTEOS NUEVOS
// =============================================
// GET /api/lottery/sync — Obtiene sorteos nuevos de loterianacional.gob.mx
// POST /api/lottery/sync — Fuerza sincronización

import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    const results = await syncLottery();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("[sync] GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const results = await syncLottery();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("[sync] POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function syncLottery() {
  const results = {
    melate: { found: 0, inserted: 0, updated: 0, latest: "" },
    revancha: { found: 0, inserted: 0, updated: 0, latest: "" },
    "super-lotto": { found: 0, inserted: 0, updated: 0, latest: "" },
  };

  const latestDraws: Record<string, number> = {};
  for (const [slug] of Object.entries(LOTTERY_IDS)) {
    const { data } = await supabase
      .from("lottery_draws")
      .select("draw_number")
      .eq("lottery_id", LOTTERY_IDS[slug])
      .order("draw_number", { ascending: false })
      .limit(1)
      .single();
    latestDraws[slug] = data ? parseInt(data.draw_number) : 0;
    results[slug as keyof typeof results].latest = String(latestDraws[slug]);
  }

  let html: string;
  try {
    const response = await fetch(
      "https://www.loterianacional.gob.mx/Melate/Resultados",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, results };
    }
    html = await response.text();
  } catch (err: any) {
    return { success: false, error: err.message, results };
  }

  const melateDraws = parseMelateFromHTML(html);
  const revanchaDraws = parseRevanchaFromHTML(html);

  results.melate.found = melateDraws.length;
  for (const draw of melateDraws) {
    const drawNum = parseInt(draw.draw_number);
    if (drawNum > latestDraws.melate) {
      const { error } = await supabase
        .from("lottery_draws")
        .upsert(
          {
            lottery_id: LOTTERY_IDS.melate,
            draw_number: draw.draw_number,
            draw_date: draw.draw_date,
            main_numbers: draw.main_numbers,
            bonus_number: draw.bonus_number,
          },
          { onConflict: "lottery_id,draw_number" }
        );
      if (!error) results.melate.inserted++;
    } else {
      results.melate.updated++;
    }
  }

  results.revancha.found = revanchaDraws.length;
  for (const draw of revanchaDraws) {
    const drawNum = parseInt(draw.draw_number);
    if (drawNum > latestDraws.revancha) {
      const { error } = await supabase
        .from("lottery_draws")
        .upsert(
          {
            lottery_id: LOTTERY_IDS.revancha,
            draw_number: draw.draw_number,
            draw_date: draw.draw_date,
            main_numbers: draw.main_numbers,
            bonus_number: null,
          },
          { onConflict: "lottery_id,draw_number" }
        );
      if (!error) results.revancha.inserted++;
    } else {
      results.revancha.updated++;
    }
  }

  return { success: true, message: "Sincronización completada", results, timestamp: new Date().toISOString() };
}

function parseMelateFromHTML(html: string) {
  const draws: Array<{
    draw_number: string;
    draw_date: string;
    main_numbers: number[];
    bonus_number: number | null;
  }> = [];

  const tableRows = html.split("<tr");

  for (const row of tableRows) {
    if (!row.includes("Melate") && !row.includes("MELATE") && !row.includes("sorteo")) continue;

    const numMatch = row.match(/(\d{4,5})/);
    if (!numMatch) continue;

    const drawNum = numMatch[1];
    const dateMatch = row.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dateMatch) continue;

    const [day, month, year] = dateMatch;
    const dateStr = `${year}-${month}-${day}`;

    const numPattern = row.match(
      /\b(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})-(\d{1,2})\b/
    );

    if (numPattern) {
      const mainNums = numPattern.slice(1, 7).map((n) => parseInt(n));
      const bonus = numPattern[7] ? parseInt(numPattern[7]) : null;

      if (mainNums.every((n) => n >= 1 && n <= 56)) {
        draws.push({
          draw_number: drawNum,
          draw_date: dateStr,
          main_numbers: mainNums.sort((a, b) => a - b),
          bonus_number: bonus,
        });
      }
    }
  }

  if (draws.length === 0) {
    const simpleRegex = /Sorteo[:\s]*(\d{4,5})[\s\S]*?(\d{2})\/(\d{2})\/(\d{4})[\s\S]*?(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})-(\d{2})/g;
    let match;
    while ((match = simpleRegex.exec(html)) !== null) {
      const [, drawNum, day, month, year, n1, n2, n3, n4, n5, n6, bonus] = match;
      const mainNums = [n1, n2, n3, n4, n5, n6].map(Number);
      if (mainNums.every((n) => n >= 1 && n <= 56)) {
        draws.push({
          draw_number: drawNum,
          draw_date: `${year}-${month}-${day}`,
          main_numbers: mainNums.sort((a, b) => a - b),
          bonus_number: bonus ? parseInt(bonus) : null,
        });
      }
    }
  }

  return draws.slice(0, 10);
}

function parseRevanchaFromHTML(html: string) {
  const draws: Array<{
    draw_number: string;
    draw_date: string;
    main_numbers: number[];
  }> = [];

  const tableRows = html.split("<tr");

  for (const row of tableRows) {
    if (!row.includes("Revancha") && !row.includes("REVANCHA")) continue;

    const numMatch = row.match(/(\d{4,5})/);
    if (!numMatch) continue;

    const drawNum = numMatch[1];
    const dateMatch = row.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dateMatch) continue;

    const [day, month, year] = dateMatch;
    const dateStr = `${year}-${month}-${day}`;

    const numPattern = row.match(
      /\b(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\b/
    );

    if (numPattern) {
      const mainNums = numPattern.slice(1, 7).map((n) => parseInt(n));
      if (mainNums.every((n) => n >= 1 && n <= 56)) {
        draws.push({
          draw_number: drawNum,
          draw_date: dateStr,
          main_numbers: mainNums.sort((a, b) => a - b),
        });
      }
    }
  }

  return draws.slice(0, 10);
}
