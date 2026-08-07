"use client";

import { useMemo, useState } from "react";
import { type MarketInfo } from "@/lib/markets";
import styles from "@/app/trade/trade.module.css";

interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

function generateCandles(basePrice: number, seed: string, count = 48): Candle[] {
  let p = basePrice * 0.94;
  const now = Date.now();
  const step = 900_000;
  const list: Candle[] = [];

  for (let i = 0; i < count; i++) {
    const delta = (Math.sin(i * 0.6) + (i % 3 === 0 ? 0.8 : -0.6)) * (basePrice * 0.012);
    const o = p;
    const c = Math.max(o * 0.8, o + delta);
    const h = Math.max(o, c) + Math.abs(delta) * 0.4;
    const l = Math.min(o, c) - Math.abs(delta) * 0.4;
    const v = Math.round(50 + Math.abs(delta * 20));
    list.push({ t: now - (count - i) * step, o, h, l, c, v });
    p = c;
  }
  if (list.length > 0) {
    list[list.length - 1]!.c = basePrice;
  }
  return list;
}

export function TradeChart({ market }: { market: MarketInfo }) {
  const [tf, setTf] = useState<Timeframe>("15m");
  const [chartType, setChartType] = useState<"candles" | "line">("candles");

  const candles = useMemo(() => generateCandles(market.price, `${market.slug}-${tf}`), [market.price, market.slug, tf]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const activeCandle = hoverIndex !== null ? candles[hoverIndex] : candles[candles.length - 1];

  const minP = Math.min(...candles.map((c) => c.l)) * 0.998;
  const maxP = Math.max(...candles.map((c) => c.h)) * 1.002;
  const rangeP = Math.max(maxP - minP, 0.001);
  const maxV = Math.max(...candles.map((c) => c.v));

  const W = 800;
  const H = 420;
  const PAD_B = 40;
  const PAD_T = 20;
  const PAD_R = 60;
  const CHART_H = H - PAD_B - PAD_T;
  const VOL_H = 80;

  const candleW = (W - PAD_R) / candles.length;

  const getY = (p: number) => PAD_T + (1 - (p - minP) / rangeP) * (CHART_H - VOL_H);
  const getVolY = (v: number) => H - PAD_B - (v / maxV) * VOL_H;

  const linePath = candles.map((c, i) => `${i === 0 ? "M" : "L"}${(i + 0.5) * candleW},${getY(c.c).toFixed(1)}`).join(" ");

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.floor(x / candleW);
    if (idx >= 0 && idx < candles.length) {
      setHoverIndex(idx);
    }
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartControls}>
        <div className={styles.timeframeList}>
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.tfBtn} ${tf === t ? styles.tfActive : ""}`}
              onClick={() => setTf(t)}
            >
              {t}
            </button>
          ))}
          <div style={{ width: 1, height: 14, background: "#222834", margin: "0 4px" }} />
          <button
            type="button"
            className={`${styles.tfBtn} ${chartType === "candles" ? styles.tfActive : ""}`}
            onClick={() => setChartType("candles")}
          >
            Candles
          </button>
          <button
            type="button"
            className={`${styles.tfBtn} ${chartType === "line" ? styles.tfActive : ""}`}
            onClick={() => setChartType("line")}
          >
            Line
          </button>
        </div>

        {activeCandle && (
          <div style={{ display: "flex", gap: 12, fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "#788296" }}>
            <span>O: <strong style={{ color: "#d1d5db" }}>${activeCandle.o.toFixed(market.decimals)}</strong></span>
            <span>H: <strong style={{ color: "#d1d5db" }}>${activeCandle.h.toFixed(market.decimals)}</strong></span>
            <span>L: <strong style={{ color: "#d1d5db" }}>${activeCandle.l.toFixed(market.decimals)}</strong></span>
            <span>C: <strong style={{ color: activeCandle.c >= activeCandle.o ? "#00c087" : "#f84960" }}>${activeCandle.c.toFixed(market.decimals)}</strong></span>
            <span>Vol: <strong style={{ color: "#d1d5db" }}>{activeCandle.v}k</strong></span>
          </div>
        )}
      </div>

      <div className={styles.chartCanvasWrapper}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "100%", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((k) => {
            const priceVal = maxP - k * rangeP;
            const y = PAD_T + k * (CHART_H - VOL_H);
            return (
              <g key={k}>
                <line x1={0} x2={W - PAD_R} y1={y} y2={y} stroke="#161b24" strokeDasharray="3 3" />
                <text x={W - PAD_R + 6} y={y + 3} fill="#647087" fontSize="10" fontFamily="var(--font-mono)">
                  ${priceVal.toFixed(market.decimals)}
                </text>
              </g>
            );
          })}

          {candles.map((c, i) => {
            const x = (i + 0.5) * candleW;
            const isGreen = c.c >= c.o;
            const col = isGreen ? "#00c087" : "#f84960";
            const topY = getY(Math.max(c.o, c.c));
            const botY = getY(Math.min(c.o, c.c));
            const barH = Math.max(1.5, botY - topY);
            const volY = getVolY(c.v);

            return (
              <g key={i}>
                <rect
                  x={x - candleW * 0.35}
                  y={volY}
                  width={candleW * 0.7}
                  height={H - PAD_B - volY}
                  fill={isGreen ? "rgba(0, 192, 135, 0.2)" : "rgba(248, 73, 96, 0.2)"}
                />

                {chartType === "candles" ? (
                  <>
                    <line x1={x} x2={x} y1={getY(c.h)} y2={getY(c.l)} stroke={col} strokeWidth="1.2" />
                    <rect
                      x={x - candleW * 0.38}
                      y={topY}
                      width={candleW * 0.76}
                      height={barH}
                      fill={col}
                      rx="1"
                    />
                  </>
                ) : null}
              </g>
            );
          })}

          {chartType === "line" && (
            <path d={linePath} fill="none" stroke="#6ee7ff" strokeWidth="1.8" />
          )}

          {hoverIndex !== null && (
            <g>
              <line
                x1={(hoverIndex + 0.5) * candleW}
                x2={(hoverIndex + 0.5) * candleW}
                y1={PAD_T}
                y2={H - PAD_B}
                stroke="#647087"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
