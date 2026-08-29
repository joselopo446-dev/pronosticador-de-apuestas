// =============================================
// PÁGINA — REVANCHA
// =============================================

import LotteryView from "../LotteryView";
import { getLotteryHistory } from "@/lib/lottery";

export default function RevanchaPage() {
  const draws = getLotteryHistory("revancha");

  return (
    <LotteryView
      name="Revancha"
      slug="revancha"
      color="pink"
      minNumber={1}
      maxNumber={56}
      numbersCount={6}
      draws={draws}
    />
  );
}
