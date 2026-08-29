// =============================================
// PÁGINA — SUPER LOTTO
// =============================================

import LotteryView from "../LotteryView";
import { SUPER_LOTTO_HISTORY } from "@/lib/lottery-data";

export default function SuperLottoPage() {
  return (
    <LotteryView
      name="Super Lotto"
      slug="super-lotto"
      color="yellow"
      minNumber={1}
      maxNumber={45}
      numbersCount={6}
      draws={SUPER_LOTTO_HISTORY}
    />
  );
}
