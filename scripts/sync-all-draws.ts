// =============================================
// SCRIPT: Insertar TODOS los sorteos en Supabase
// =============================================
// Ejecutar: npx tsx scripts/sync-all-draws.ts

import { MELATE_HISTORY, REVANCHA_HISTORY, SUPER_LOTTO_HISTORY } from "../src/lib/lottery-data";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uarjzimujqwflmgytohf.supabase.co";
const SUPABASE_KEY = "sb_publishable__CYfl3-Xc7pNcQCvKEjlTw_RjGUzpWN";

const LOTTERY_IDS: Record<string, string> = {
  melate: "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
  revancha: "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
  "super-lotto": "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function insertDraws(lotteryId: string, draws: any[], name: string) {
  console.log(`\nInserting ${draws.length} ${name} draws...`);
  
  const BATCH = 100;
  let inserted = 0;
  
  for (let i = 0; i < draws.length; i += BATCH) {
    const batch = draws.slice(i, i + BATCH).map(d => ({
      lottery_id: lotteryId,
      draw_number: d.drawNumber,
      draw_date: d.drawDate,
      main_numbers: d.mainNumbers,
      bonus_number: d.bonusNumber,
      jackpot_amount: d.jackpotAmount,
    }));
    
    const { error } = await supabase
      .from("lottery_draws")
      .upsert(batch, { onConflict: "lottery_id,draw_date" });
    
    if (error) {
      console.error(`  Error at batch ${i}:`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`  ${inserted}/${draws.length}\r`);
    }
  }
  
  console.log(`  ✅ ${inserted} ${name} draws inserted`);
  return inserted;
}

async function main() {
  const m = await insertDraws(LOTTERY_IDS.melate, MELATE_HISTORY, "Melate");
  const r = await insertDraws(LOTTERY_IDS.revancha, REVANCHA_HISTORY, "Revancha");
  const s = await insertDraws(LOTTERY_IDS["super-lotto"], SUPER_LOTTO_HISTORY, "Super Lotto");
  
  console.log(`\n📊 Total: ${m + r + s} sorteos en Supabase`);
  
  // Verify
  for (const [name, id] of Object.entries(LOTTERY_IDS)) {
    const { count } = await supabase
      .from("lottery_draws")
      .select("*", { count: "exact", head: true })
      .eq("lottery_id", id);
    console.log(`  ${name}: ${count} sorteos`);
  }
}

main().catch(console.error);
