// =============================================
// SCRIPT: Crear/Recrear tabla lottery_predictions
// =============================================
// Ejecutar: npx tsx scripts/create-predictions-table.ts

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uarjzimujqwflmgytohf.supabase.co",
  "sb_publishable__CYfl3-Xc7pNcQCvKEjlTw_RjGUzpWN"
);

async function main() {
  // Drop old table if exists
  console.log("Dropping old table...");
  const { error: dropError } = await supabase.rpc("exec_sql", {
    sql: "DROP TABLE IF EXISTS lottery_predictions CASCADE;"
  }).maybeSingle();
  
  if (dropError) {
    console.log("RPC not available, trying direct approach...");
  }

  // Create table via SQL
  console.log("Creating table...");
  const sql = `
    CREATE TABLE IF NOT EXISTS lottery_predictions (
      id BIGSERIAL PRIMARY KEY,
      lottery_id UUID NOT NULL REFERENCES lotteries(id),
      draw_number TEXT NOT NULL,
      draw_date DATE NOT NULL,
      strategy TEXT NOT NULL,
      predicted_numbers INTEGER[] NOT NULL,
      confidence DECIMAL(3,2) DEFAULT 0.5,
      matched_numbers INTEGER DEFAULT 0,
      matched_bonus BOOLEAN DEFAULT FALSE,
      prize_level TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'checked', 'won', 'lost')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      checked_at TIMESTAMPTZ,
      UNIQUE(lottery_id, draw_number, strategy)
    );

    CREATE INDEX IF NOT EXISTS idx_predictions_status ON lottery_predictions(status);
    CREATE INDEX IF NOT EXISTS idx_predictions_draw ON lottery_predictions(lottery_id, draw_date);
  `;

  const { error: createError } = await supabase.rpc("exec_sql", { sql }).maybeSingle();
  
  if (createError) {
    console.log("RPC not available. Please create the table manually in Supabase SQL Editor:");
    console.log("\n" + sql);
  } else {
    console.log("✅ Table created!");
  }

  // Verify
  const { data, error } = await supabase.from("lottery_predictions").select("*").limit(1);
  if (error) {
    console.log("Verify error:", error.message);
  } else {
    console.log("✅ Table verified, rows:", data?.length || 0);
  }
}

main().catch(console.error);
