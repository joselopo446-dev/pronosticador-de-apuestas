const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://uarjzimujqwflmgytohf.supabase.co";
const SUPABASE_KEY = "sb_publishable__CYfl3-Xc7pNcQCvKEjlTw_RjGUzpWN";

// UUIDs de la tabla lotteries
const LOTTERY_IDS = {
  melate: "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
  revancha: "a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
  "super-lotto": "b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
};

function parseDraws(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const regex = /\{\s*id:\s*"(\d+)",\s*lotteryId:\s*"([^"]+)",\s*drawNumber:\s*"(\d+)",\s*drawDate:\s*"([\d-]+)",\s*mainNumbers:\s*\[([\d,\s]+)\](?:,\s*bonusNumber:\s*(\d+|null))?(?:,\s*jackpotAmount:\s*(\d+))?\s*\}/g;
  const draws = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const lotterySlug = match[2];
    draws.push({
      lottery_id: LOTTERY_IDS[lotterySlug] || lotterySlug,
      draw_number: match[3],
      draw_date: match[4],
      main_numbers: `{${match[5].trim()}}`,
      bonus_number: match[6] !== "null" ? parseInt(match[6]) : null,
      jackpot_amount: match[7] ? parseInt(match[7]) : null,
    });
  }
  return draws;
}

async function insertBatch(tableName, draws) {
  const BATCH_SIZE = 100;
  let inserted = 0;
  
  for (let i = 0; i < draws.length; i += BATCH_SIZE) {
    const batch = draws.slice(i, i + BATCH_SIZE);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify(batch),
    });
    
    if (response.ok) {
      inserted += batch.length;
    } else {
      const err = await response.text();
      console.error(`  Error at ${i}:`, err.substring(0, 200));
    }
  }
  
  return inserted;
}

async function main() {
  const srcDir = path.join(__dirname, "..", "src", "lib");
  
  console.log("Parsing lottery data...");
  
  const melate1 = parseDraws(path.join(srcDir, "lottery-data-part1.ts"));
  const melate2 = parseDraws(path.join(srcDir, "lottery-data-part2.ts"));
  const melate3 = parseDraws(path.join(srcDir, "lottery-data-part3.ts"));
  const mainData = parseDraws(path.join(srcDir, "lottery-data.ts"));
  
  const melate = [...melate1, ...melate2, ...melate3];
  const revancha = mainData.filter(d => d.lottery_id === LOTTERY_IDS.revancha);
  const superLotto = mainData.filter(d => d.lottery_id === LOTTERY_IDS["super-lotto"]);
  
  console.log(`Melate: ${melate.length}, Revancha: ${revancha.length}, SuperLotto: ${superLotto.length}`);
  
  // Insert all
  console.log("\nInserting Melate...");
  const m = await insertBatch("lottery_draws", melate);
  console.log(`  ✅ ${m} inserted`);
  
  console.log("Inserting Revancha...");
  const r = await insertBatch("lottery_draws", revancha);
  console.log(`  ✅ ${r} inserted`);
  
  console.log("Inserting Super Lotto...");
  const s = await insertBatch("lottery_draws", superLotto);
  console.log(`  ✅ ${s} inserted`);
  
  console.log(`\n📊 Total: ${m + r + s} sorteos insertados en Supabase`);
}

main().catch(console.error);
