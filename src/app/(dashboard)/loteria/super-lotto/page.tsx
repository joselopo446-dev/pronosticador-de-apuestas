// =============================================
// PÁGINA — SUPER LOTTO
// =============================================

import LotteryView from "../LotteryView";
import { getLotteryHistory } from "@/lib/lottery";

export default function SuperLottoPage() {
  const draws = getLotteryHistory("super-lotto");

  return (
    <LotteryView
      name="Super Lotto"
      slug="super-lotto"
      color="yellow"
      minNumber={1}
      maxNumber={45}
      numbersCount={6}
      draws={draws}
    />
  );
}
