type Props = { asset: string; size?: number };

const COINS: Record<string, { bg: string; text: string; symbol: string }> = {
  BTC:  { bg: "#F7931A", text: "#fff", symbol: "₿" },
  SOL:  { bg: "#9945FF", text: "#fff", symbol: "S" },
  ETH:  { bg: "#627EEA", text: "#fff", symbol: "Ξ" },
  USDC: { bg: "#2775CA", text: "#fff", symbol: "$" },
  USDT: { bg: "#26A17B", text: "#fff", symbol: "₮" },
};

export function CoinIcon({ asset, size = 24 }: Props) {
  const coin = COINS[asset.toUpperCase()];
  if (!coin) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.4, background: "#374151" }}
        className="rounded-full inline-flex items-center justify-center text-white font-bold shrink-0"
      >
        {asset.slice(0, 1)}
      </span>
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42, background: coin.bg, color: coin.text }}
      className="rounded-full inline-flex items-center justify-center font-bold shrink-0 select-none"
    >
      {coin.symbol}
    </span>
  );
}
