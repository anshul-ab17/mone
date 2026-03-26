import type { Trade } from "../../engine/v1/types";

export function calculateSlippage(trades: Trade[], expectedPrice: number) {
  if (trades.length === 0) {
    return { avgPrice: 0, slippage: 0 };
  }

  let totalQty = 0;
  let totalValue = 0;

  for (const t of trades) {
    totalQty += t.quantity;
    totalValue += t.price * t.quantity;
  }

  const avgPrice = totalValue / totalQty;

  const slippage =
    ((avgPrice - expectedPrice) / expectedPrice) * 100;

  return { avgPrice, slippage };
}