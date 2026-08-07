"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./TradeDemo.module.css";

export function seededRng(seedStr: string): () => number {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  let a = seed || 0x9e3779b9;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCryptoSeries(basePrice: number, seedStr: string): [number, number][] {
  const rnd = seededRng(seedStr);
  const n = 64;
  const now = Date.now();
  const span = 24 * 3600_000;
  let v = basePrice * 0.96;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    v += (rnd() - 0.48) * (basePrice * 0.008);
    if (k > 0.7) v += (basePrice - v) * 0.3;
    pts.push([now - span + span * k, Math.round(i === n - 1 ? basePrice : v)]);
  }
  return pts;
}

export interface DemoData {
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  points?: [number, number][];
}

const DEMO_AMOUNT_BTC = 0.45;
const COUNT_MS = 1600;

const CHART_W = 520;
const CHART_H = 210;
const PAD_L = 48;
const PAD_R = 12;
const PAD_Y = 16;

function fmt(n: number, dp = 2): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function TradeScreen({ data, active }: { data: DemoData; active: boolean }) {
  const revealed = active;
  const [amount, setAmount] = useState(0);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!revealed) return;
    if (reduced) {
      setAmount(DEMO_AMOUNT_BTC);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min((t - t0) / COUNT_MS, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      setAmount(DEMO_AMOUNT_BTC * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [revealed, reduced]);

  const totalUsdt = amount * data.price;
  const fee = totalUsdt * 0.0004;

  const chart = useMemo(() => {
    const pts = data.points && data.points.length >= 2 ? data.points : buildCryptoSeries(data.price, data.pair);
    const prices = pts.map(([, p]) => p);
    const minP = Math.min(...prices) * 0.998;
    const maxP = Math.max(...prices) * 1.002;
    const rangeP = Math.max(maxP - minP, 1);

    const t0 = pts[0]![0];
    const t1 = pts[pts.length - 1]![0];
    const span = Math.max(t1 - t0, 1);

    const x = (t: number) => PAD_L + ((t - t0) / span) * (CHART_W - PAD_L - PAD_R);
    const y = (p: number) => PAD_Y + (1 - (p - minP) / rangeP) * (CHART_H - PAD_Y * 2);

    const path = pts.map(([t, p], i) => `${i === 0 ? "M" : "L"}${x(t).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
    const area = `${path} L${x(t1).toFixed(1)},${CHART_H - PAD_Y} L${x(t0).toFixed(1)},${CHART_H - PAD_Y} Z`;

    const axisY = [minP, minP + rangeP * 0.5, maxP];
    const dateLabel = (t: number) => {
      const d = new Date(t);
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    return { pts, x, y, path, area, axisY, axisX: [t0, t0 + span / 2, t1].map(dateLabel) };
  }, [data.price, data.pair, data.points]);

  const [hover, setHover] = useState<number | null>(null);
  const onChartMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * CHART_W;
    const k = (px - PAD_L) / (CHART_W - PAD_L - PAD_R);
    const idx = Math.round(k * (chart.pts.length - 1));
    setHover(Math.max(0, Math.min(chart.pts.length - 1, idx)));
  };

  return (
    <div>
      <div className={styles.body}>
        <div className={styles.chartSide}>
          <div className={styles.marketHead}>
            <span className={styles.fixture}>{data.pair}</span>
            <span className={styles.title}>Spot Trading</span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.bigPrice}>${fmt(data.price, 2)}</span>
            <span className={styles.delta} data-up={data.change24h >= 0}>
              {data.change24h >= 0 ? "▲ +" : "▼ "}{Math.abs(data.change24h).toFixed(2)}%
            </span>
            <span className={styles.chipLabel}>24h Change</span>
          </div>

          <div className={styles.statsBar}>
            <div>
              <span className={styles.statLabel}>24h High</span>
              <span className={styles.statVal}>${fmt(data.high24h, 2)}</span>
            </div>
            <div>
              <span className={styles.statLabel}>24h Low</span>
              <span className={styles.statVal}>${fmt(data.low24h, 2)}</span>
            </div>
            <div>
              <span className={styles.statLabel}>24h Volume</span>
              <span className={styles.statVal}>{data.volume24h}</span>
            </div>
          </div>

          {chart && (
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className={styles.chart}
              aria-label="Price chart"
              onMouseMove={onChartMove}
              onMouseLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {chart.axisY.map((p, idx) => (
                <g key={idx}>
                  <line
                    x1={PAD_L}
                    x2={CHART_W - PAD_R}
                    y1={PAD_Y + (idx / 2) * (CHART_H - PAD_Y * 2)}
                    y2={PAD_Y + (idx / 2) * (CHART_H - PAD_Y * 2)}
                    className={styles.grid}
                  />
                  <text x={2} y={PAD_Y + (idx / 2) * (CHART_H - PAD_Y * 2) + 3} className={styles.gridLabel}>
                    ${fmt(p, 0)}
                  </text>
                </g>
              ))}

              {chart.axisX.map((label, i) => (
                <text
                  key={label + i}
                  x={i === 0 ? PAD_L : i === 1 ? (PAD_L + CHART_W - PAD_R) / 2 : CHART_W - PAD_R}
                  y={CHART_H - 2}
                  textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"}
                  className={styles.gridLabel}
                >
                  {label}
                </text>
              ))}

              <path d={chart.area} fill="url(#chartGrad)" />
              <path d={chart.path} className={`${styles.lineYes} ${revealed ? styles.draw : ""}`} />

              {hover !== null &&
                (() => {
                  const [t, p] = chart.pts[hover]!;
                  const hx = chart.x(t);
                  const hy = chart.y(p);
                  const flip = hx > CHART_W / 2;
                  const bx = flip ? hx - 130 : hx + 10;
                  return (
                    <g className={styles.hoverLayer}>
                      <line x1={hx} x2={hx} y1={PAD_Y} y2={CHART_H - PAD_Y} className={styles.crosshair} />
                      <circle cx={hx} cy={hy} r={4} className={styles.dotYes} />
                      <rect x={bx} y={PAD_Y + 4} width={120} height={42} rx={6} className={styles.tipBox} />
                      <text x={bx + 10} y={PAD_Y + 20} className={`${styles.tipText} ${styles.tipYes}`}>
                        ${fmt(p, 2)}
                      </text>
                      <text x={bx + 10} y={PAD_Y + 36} className={styles.tipText}>
                        {(() => {
                          const d = new Date(t);
                          const hh = String(d.getUTCHours()).padStart(2, "0");
                          const mm = String(d.getUTCMinutes()).padStart(2, "0");
                          return `${hh}:${mm}`;
                        })()}
                      </text>
                    </g>
                  );
                })()}
            </svg>
          )}

          <div className={styles.timeframes} aria-hidden>
            <span>15M</span>
            <span>1H</span>
            <span>4H</span>
            <span data-active="true">1D</span>
            <span>1W</span>
          </div>
          <p className={styles.chartCaption}>
            Real-time central limit order book data with ultra-low latency matching
          </p>
        </div>

        <div className={styles.orderSide}>
          <div className={styles.sideToggle}>
            <button type="button" data-kind="yes" data-active={side === "buy"} onClick={() => setSide("buy")}>
              Buy BTC
            </button>
            <button type="button" data-kind="no" data-active={side === "sell"} onClick={() => setSide("sell")}>
              Sell BTC
            </button>
          </div>

          <div className={styles.buySellTabs}>
            <span data-active={orderType === "limit"} onClick={() => setOrderType("limit")}>
              Limit
            </span>
            <span data-active={orderType === "market"} onClick={() => setOrderType("market")}>
              Market
            </span>
          </div>

          <div className={styles.amount}>
            <span className={styles.amountLabel}>Order Price</span>
            <span className={styles.amountValue}>
              {fmt(data.price, 2)} <span className={styles.unit}>USDT</span>
            </span>
          </div>

          <div className={styles.amount} style={{ marginTop: 8 }}>
            <span className={styles.amountLabel}>Amount</span>
            <span className={styles.amountValue}>
              {fmt(amount, 4)} <span className={styles.unit}>BTC</span>
            </span>
          </div>

          <div className={styles.chips} aria-hidden>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>

          <span
            className={styles.buyBtn}
            role="presentation"
            style={{
              background: side === "buy" ? "var(--green, #4ade80)" : "var(--red, #f87171)",
              color: "#05111a",
            }}
          >
            {side === "buy" ? "Buy BTC" : "Sell BTC"}
          </span>

          <dl className={styles.calc}>
            <div>
              <dt>Total</dt>
              <dd>${fmt(totalUsdt, 2)} USDT</dd>
            </div>
            <div>
              <dt>Est. Fee (0.04%)</dt>
              <dd>${fmt(fee, 2)} USDT</dd>
            </div>
            <div>
              <dt>Execution</dt>
              <dd className={styles.toWin}>&lt; 1ms Match</dd>
            </div>
          </dl>
          <p className={styles.orderCaption}>High-performance memory matching engine · 100k TPS</p>
        </div>
      </div>

      <div className={styles.outcomes}>
        <div className={styles.outcomeRow}>
          <span className={styles.outcomeName}>Best Bid</span>
          <span className={styles.outcomePrice}>${fmt(data.price - 0.5, 2)}</span>
          <span className={styles.delta} data-up={true}>
            4.250 BTC
          </span>
          <span className={styles.oYes} role="presentation">
            Quick Buy
          </span>
        </div>
        <div className={styles.outcomeRow}>
          <span className={styles.outcomeName}>Best Ask</span>
          <span className={styles.outcomePrice}>${fmt(data.price + 0.5, 2)}</span>
          <span className={styles.delta} data-up={false}>
            6.120 BTC
          </span>
          <span className={styles.oNo} role="presentation">
            Quick Sell
          </span>
        </div>
      </div>
    </div>
  );
}
