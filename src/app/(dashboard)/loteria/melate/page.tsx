// =============================================
// PÁGINA — MELATE
// =============================================

import LotteryView from "../LotteryView";
import { getLotteryHistory } from "@/lib/lottery";

export default function MelatePage() {
  const draws = getLotteryHistory("melate");

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
