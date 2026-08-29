// =============================================
// PÁGINA — REVANCHA
// =============================================

import LotteryView from "../LotteryView";
import { REVANCHA_HISTORY } from "@/lib/lottery-data";

export default function RevanchaPage() {
  return (
    <LotteryView
      name="Revancha"
      slug="revancha"
      color="pink"
      minNumber={1}
      maxNumber={56}
      numbersCount={6}
      draws={REVANCHA_HISTORY}
    />
  );
}
