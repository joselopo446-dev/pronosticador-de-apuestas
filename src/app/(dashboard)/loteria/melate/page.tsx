// =============================================
// PÁGINA — MELATE (lee de Supabase)
// =============================================

import LotteryView from "../LotteryView";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 1800;

export default async function MelatePage() {
  const { data } = await supabase
    .from("lottery_draws")
    .select("draw_number, draw_date, main_numbers, bonus_number, jackpot_amount")
    .eq("lottery_id", "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66")
    .order("draw_date", { ascending: false })
    .limit(500);

  const draws = (data || []).map((d, i) => ({
    id: String(i + 1),
    lotteryId: "melate",
    drawNumber: d.draw_number,
    drawDate: d.draw_date,
    mainNumbers: d.main_numbers,
    bonusNumber: d.bonus_number,
    jackpotAmount: d.jackpot_amount,
  }));

  return (
    <LotteryView
      name="Melate"
      slug="melate"
      color="purple"
      minNumber={1}
      maxNumber={56}
      numbersCount={6}
      draws={draws}
    />
  );
}
