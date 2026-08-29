// =============================================
// PÁGINA — MELATE
// =============================================

import LotteryView from "../LotteryView";
import { MELATE_HISTORY } from "@/lib/lottery-data";

export default function MelatePage() {
  return (
    <LotteryView
      name="Melate"
      slug="melate"
      color="purple"
      minNumber={1}
      maxNumber={56}
      numbersCount={6}
      draws={MELATE_HISTORY}
    />
  );
}
