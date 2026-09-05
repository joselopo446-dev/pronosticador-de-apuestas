// =============================================
// API — SINCRONIZAR SORTEOS NUEVOS
// =============================================
// GET /api/lottery/sync — Scrapea loterianacional.gob.mx y guarda sorteos nuevos

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

// Scraping de loterianacional.gob.mx
async function scrapeOfficialResults() {
  try {
    const response = await fetch("https://www.loterianacional.gob.mx/Melate/Resultados", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) return { melate: [], revancha: [] };

    const html = await response.text();

    // Parse Melate results from HTML
    // Pattern: Sorteo: XXXX followed by date and numbers
    const melateDraws = parseMelateFromHTML(html);
    const revanchaDraws = parseRevanchaFromHTML(html);

    return { melate: melateDraws, revancha: revanchaDraws };
  } catch (error) {
    console.error("[sync] Scrape error:", error);
    return { melate: [], revancha: [] };
  }
}

function parseMelateFromHTML(html: string): Array<{
  draw_number: string;
  draw_date: string;
  main_numbers: number[];
  bonus_number: number | null;
}> {
  const draws: Array<{
    draw_number: string;
    draw_date: string;
    main_numbers: number[];
    bonus_number: number | null;
  }> = [];

  // Find the historical section for Melate
  // Pattern in HTML: Sorteo XXXX, Fecha DD/MM/YYYY, numbers
  const sorteoRegex = /Sorteo:\s*(\d+)[\s\S]*?Fecha\s+(\d{2}\/\d{2}\/\d{4})[\s\S]*?Combinación ganadora[\s\S]*?(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})-(\d{2})/g;

  let match;
  while ((match = sorteoRegex.exec(html)) !== null) {
    const [, drawNum, dateStr, n1, n2, n3, n4, n5, n6, bonus] = match;
    const [day, month, year] = dateStr.split("/");

    draws.push({
      draw_number: drawNum,
      draw_date: `${year}-${month}-${day}`,
      main_numbers: [n1, n2, n3, n4, n5, n6].map(Number),
      bonus_number: parseInt(bonus),
    });
  }

  // Also try simpler pattern for recent results
  if (draws.length === 0) {
    // Try to find numbers in format: XX XX XX XX XX XX-XX
    const recentRegex = /(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})-(\d{2})/g;
    let recentMatch;
    while ((recentMatch = recentRegex.exec(html)) !== null) {
      const [n1, n2, n3, n4, n5, n6, bonus] = recentMatch.slice(1).map(Number);
      // Only add if numbers are valid (1-56)
      if (n1 >= 1 && n1 <= 56 && n6 >= 1 && n6 <= 56) {
        // Try to find associated draw number and date
        const before = html.substring(Math.max(0, recentMatch.index - 200), recentMatch.index);
        const sorteoMatch = before.match(/Sorteo:\s*(\d+)/);
        const fechaMatch = before.match(/Fecha\s+(\d{2}\/\d{2}\/\d{4})/);

        if (sorteoMatch && fechaMatch) {
          const [, day, month, year] = fechaMatch[1].split("/");
          draws.push({
            draw_number: sorteoMatch[1],
            draw_date: `${year}-${month}-${day}`,
            main_numbers: [n1, n2, n3, n4, n5, n6],
            bonus_number: bonus,
          });
        }
      }
    }
  }

  return draws;
}

function parseRevanchaFromHTML(html: string): Array<{
  draw_number: string;
  draw_date: string;
  main_numbers: number[];
}> {
  const draws: Array<{
    draw_number: string;
    draw_date: string;
    main_numbers: number[];
  }> = [];

  // Find Revancha section
  const revanchaSection = html.split("Revancha")[1];
  if (!revanchaSection) return draws;

  // Pattern: Sorteo XXXX, Fecha DD/MM/YYYY, numbers (no bonus)
  const sorteoRegex = /Sorteo:\s*(\d+)[\s\S]*?Fecha\s+(\d{2}\/\d{2}\/\d{4})[\s\S]*?Combinación ganadora[\s\S]*?(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})\s+(\d{2})/g;

  let match;
  while ((match = sorteoRegex.exec(revanchaSection)) !== null) {
    const [, drawNum, dateStr, n1, n2, n3, n4, n5, n6] = match;
    const [day, month, year] = dateStr.split("/");

    draws.push({
      draw_number: drawNum,
      draw_date: `${year}-${month}-${day}`,
      main_numbers: [n1, n2, n3, n4, n5, n6].map(Number),
    });
  }

  return draws;
}

export async function GET() {
  const results = {
    melate: { found: 0, inserted: 0, latest: "" },
    revancha: { found: 0, inserted: 0, latest: "" },
    "super-lotto": { found: 0, inserted: 0, latest: "" },
  };

  // Get latest draw numbers in DB
  const latestDraws: Record<string, number> = {};
  for (const [slug, lotteryId] of Object.entries(LOTTERY_IDS)) {
    const { data } = await supabase
      .from("lottery_draws")
      .select("draw_number")
      .eq("lottery_id", lotteryId)
      .order("draw_date", { ascending: false })
      .limit(1)
      .single();

    latestDraws[slug] = data ? parseInt(data.draw_number) : 0;
    results[slug as keyof typeof results].latest = String(latestDraws[slug]);
  }

  // Scrape official results
  const { melate: melateDraws, revancha: revanchaDraws } = await scrapeOfficialResults();

  // Insert Melate draws
  results.melate.found = melateDraws.length;
  for (const draw of melateDraws) {
    if (parseInt(draw.draw_number) > latestDraws.melate) {
      const { error } = await supabase
        .from("lottery_draws")
        .upsert({
          lottery_id: LOTTERY_IDS.melate,
          draw_number: draw.draw_number,
          draw_date: draw.draw_date,
          main_numbers: draw.main_numbers,
          bonus_number: draw.bonus_number,
        }, { onConflict: "lottery_id,draw_date" });

      if (!error) results.melate.inserted++;
    }
  }

  // Insert Revancha draws
  results.revancha.found = revanchaDraws.length;
  for (const draw of revanchaDraws) {
    if (parseInt(draw.draw_number) > latestDraws.revancha) {
      const { error } = await supabase
        .from("lottery_draws")
        .upsert({
          lottery_id: LOTTERY_IDS.revancha,
          draw_number: draw.draw_number,
          draw_date: draw.draw_date,
          main_numbers: draw.main_numbers,
          bonus_number: null,
        }, { onConflict: "lottery_id,draw_date" });

      if (!error) results.revancha.inserted++;
    }
  }

  return NextResponse.json({
    success: true,
    message: "Sincronización completada",
    results,
    timestamp: new Date().toISOString(),
  });
}
