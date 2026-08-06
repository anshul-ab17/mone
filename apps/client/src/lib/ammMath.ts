export const BPS_DENOM = 10_000n;

export interface QuoteBuy {
  tokensOut: bigint;
  fee: bigint;
  newReserveBuy: bigint;
  newReserveOther: bigint;
  avgPriceScaled: bigint;
}

export interface QuoteSell {
  netOut: bigint;
  gross: bigint;
  fee: bigint;
  newReserveSell: bigint;
  newReserveOther: bigint;
}

const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

export function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = 1n << (BigInt(n.toString(2).length + 1) / 2n);
  for (;;) {
    const next = (x + n / x) / 2n;
    if (next >= x) break;
    x = next;
  }
  while (x * x > n) x -= 1n;
  while ((x + 1n) * (x + 1n) <= n) x += 1n;
  return x;
}

export const calcFee = (amount: bigint, feeBps: number): bigint => (amount * BigInt(feeBps)) / BPS_DENOM;

export function quoteBuy(reserveBuy: bigint, reserveOther: bigint, amountIn: bigint, feeBps: number): QuoteBuy | null {
  if (amountIn <= 0n || reserveBuy <= 0n || reserveOther <= 0n) return null;
  const fee = calcFee(amountIn, feeBps);
  const net = amountIn - fee;
  if (net <= 0n) return null;
  const ending = ceilDiv(reserveBuy * reserveOther, reserveOther + net);
  const tokensOut = reserveBuy + net - ending;
  if (tokensOut <= 0n) return null;
  return {
    tokensOut,
    fee,
    newReserveBuy: ending,
    newReserveOther: reserveOther + net,
    avgPriceScaled: (amountIn * 1_000_000n) / tokensOut,
  };
}

export function quoteSell(reserveSell: bigint, reserveOther: bigint, tokensIn: bigint, feeBps: number): QuoteSell | null {
  if (tokensIn <= 0n || reserveSell <= 0n || reserveOther <= 0n) return null;
  const s = reserveSell + reserveOther + tokensIn;
  const gross = (s - isqrt(s * s - 4n * reserveOther * tokensIn)) / 2n;
  if (gross <= 0n) return null;
  const fee = calcFee(gross, feeBps);
  return {
    netOut: gross - fee,
    gross,
    fee,
    newReserveSell: reserveSell + tokensIn - gross,
    newReserveOther: reserveOther - gross,
  };
}

export function spotPriceScaled(reserveThis: bigint, reserveOther: bigint): bigint {
  const total = reserveThis + reserveOther;
  if (total === 0n) return 500_000n;
  return (reserveOther * 1_000_000n) / total;
}

export function minOutForTolerance(expectedOut: bigint, toleranceBps: number): bigint {
  const t = BigInt(Math.max(0, Math.min(10_000, Math.round(toleranceBps))));
  return (expectedOut * (BPS_DENOM - t)) / BPS_DENOM;
}

export function buyImpactBps(reserveBuy: bigint, reserveOther: bigint, q: QuoteBuy): number {
  const spot = spotPriceScaled(reserveBuy, reserveOther);
  if (spot === 0n) return 0;
  const impact = ((q.avgPriceScaled - spot) * 10_000n) / spot;
  return Number(impact < 0n ? 0n : impact);
}
