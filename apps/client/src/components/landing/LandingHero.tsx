"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import logoImg from "@/assets/warriorr.png";
import { TradeScreen, seededRng, type DemoData } from "./TradeDemo";
import { ChromeCta } from "./ChromeCta";
import demoStyles from "./TradeDemo.module.css";
import styles from "@/app/landing.module.css";

export interface CryptoMarket {
  pair: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: string;
}

export interface ActivityRow {
  pair: string;
  side: "BUY" | "SELL";
  amount: string;
  price: number;
  total: string;
  t: number;
}

const TABS = [
  { id: "trade", label: "Trade" },
  { id: "markets", label: "Markets" },
  { id: "portfolio", label: "Portfolio" },
  { id: "activity", label: "Activity" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function timeAgo(t: number): string {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(n: number, dp = 2): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function Spark({ seed, up }: { seed: string; up: boolean }) {
  const rnd = seededRng(seed);
  let v = up ? 9 : 4;
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    v += (rnd() - (up ? 0.58 : 0.42)) * 3.2;
    v = Math.min(15, Math.max(2, v));
    pts.push(`${(i / 15) * 62},${v.toFixed(1)}`);
  }
  return (
    <svg viewBox="0 0 62 17" className={demoStyles.spark} aria-hidden>
      <polyline points={pts.join(" ")} data-up={up} />
    </svg>
  );
}

const SPOT_MARKETS: CryptoMarket[] = [
  { pair: "BTC/USDT", name: "Bitcoin", price: 96420.50, change24h: 3.42, volume24h: "$1.82B" },
  { pair: "ETH/USDT", name: "Ethereum", price: 2780.25, change24h: 2.15, volume24h: "$890M" },
  { pair: "SOL/USDT", name: "Solana", price: 184.60, change24h: 5.82, volume24h: "$640M" },
  { pair: "AVAX/USDT", name: "Avalanche", price: 34.10, change24h: -1.24, volume24h: "$120M" },
  { pair: "DOGE/USDT", name: "Dogecoin", price: 0.245, change24h: 8.90, volume24h: "$350M" },
  { pair: "BNB/USDT", name: "BNB", price: 645.80, change24h: 1.10, volume24h: "$210M" },
];

function MarketsScreen() {
  return (
    <div>
      <div className={demoStyles.screenNote}>Spot &amp; Futures Markets · High Liquidity Pairs</div>
      <div className={demoStyles.marketsScreen}>
        {SPOT_MARKETS.map((m) => (
          <div key={m.pair} className={demoStyles.previewCard}>
            <span className={demoStyles.previewCardTop}>
              <span className={demoStyles.fixture}>{m.pair}</span>
              <span className={demoStyles.sampleTag}>{m.name}</span>
            </span>
            <span className={demoStyles.previewTitle}>${fmt(m.price, m.price < 1 ? 4 : 2)}</span>
            <span className={demoStyles.previewMid}>
              <span className={demoStyles.previewChance} style={{ color: m.change24h >= 0 ? "var(--green, #4ade80)" : "var(--red, #f87171)" }}>
                {m.change24h >= 0 ? "+" : ""}{m.change24h.toFixed(2)}%
              </span>
              <Spark seed={m.pair} up={m.change24h >= 0} />
            </span>
            <span className={demoStyles.chipLabel}>
              24h Vol: {m.volume24h}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlChart() {
  const rnd = seededRng("mone-pl");
  const W = 730;
  const H = 190;
  let v = 145;
  const pts: [number, number][] = [];
  for (let i = 0; i < 40; i++) {
    v += (rnd() - 0.62) * 18;
    v = Math.min(172, Math.max(36, v));
    pts.push([12 + (i / 39) * (W - 24), i === 39 ? 40 : v]);
  }
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={demoStyles.plChart} aria-hidden>
      {[0.25, 0.5, 0.75].map((k) => (
        <line key={k} x1={12} x2={W - 12} y1={H * k} y2={H * k} className={demoStyles.plGrid} />
      ))}
      <path d={d} />
      <circle cx={last[0]} cy={last[1]} r={4} />
    </svg>
  );
}

function PortfolioScreen() {
  const assets = [
    { coin: "BTC", name: "Bitcoin", balance: 1.4502, valueUsdt: 139829.01, pnl: 4820.50, up: true },
    { coin: "ETH", name: "Ethereum", balance: 12.8000, valueUsdt: 35587.20, pnl: 1240.00, up: true },
    { coin: "SOL", name: "Solana", balance: 85.0000, valueUsdt: 15691.00, pnl: -320.10, up: false },
    { coin: "USDT", name: "Tether USD", balance: 24500.00, valueUsdt: 24500.00, pnl: 0.00, up: true },
  ];

  return (
    <div className={demoStyles.pfScreen}>
      <div className={demoStyles.pfTop}>
        <div className={demoStyles.pfLeft}>
          <div className={`${demoStyles.pfCard} ${demoStyles.pfGreen}`}>
            <span className={demoStyles.pfCardLabel}>Total Net Equity</span>
            <span className={demoStyles.pfBig}>
              $215,607.21 <span className={demoStyles.pfUnit}>USD</span>
            </span>
            <svg viewBox="0 0 44 30" className={demoStyles.pfArrow} aria-hidden>
              <path d="M2 26 L14 15 L22 20 L40 4 M30 4 h10 v10" />
            </svg>
          </div>
          <div className={`${demoStyles.pfCard} ${demoStyles.pfBlue}`}>
            <span className={demoStyles.pfCardLabel}>Available Margin</span>
            <span className={demoStyles.pfBig}>
              $48,920.00 <span className={demoStyles.pfUnit}>USDT</span>
            </span>
          </div>
          <div className={demoStyles.pfBtns}>
            <span className={demoStyles.depositBtn} role="presentation">
              <span className={demoStyles.pfBtnIcon}>↓</span> Deposit
            </span>
            <span className={demoStyles.withdrawBtn} role="presentation">
              <span className={demoStyles.pfBtnIcon} data-ghost="true">↑</span> Withdraw
            </span>
          </div>
        </div>
        <div className={demoStyles.plCard}>
          <div className={demoStyles.plHead}>
            <span className={demoStyles.chipLabel}>30-Day PnL</span>
            <span className={demoStyles.plValue}>
              +$18,420.50 <span className={demoStyles.plPct}>▲ +12.4%</span>
            </span>
            <span className={demoStyles.chipLabel}>Past Month</span>
          </div>
          <PlChart />
        </div>
      </div>

      <div className={demoStyles.posTable}>
        <div className={demoStyles.posHead}>
          <span>Asset</span>
          <span>Balance</span>
          <span>Value (USDT)</span>
        </div>
        {assets.map((a) => (
          <div key={a.coin} className={demoStyles.posRow}>
            <div className={demoStyles.positionMain}>
              <span className={demoStyles.previewTitle}>{a.coin}</span>
              <span className={demoStyles.chipLabel}>{a.name}</span>
            </div>
            <span className={demoStyles.posCur}>{fmt(a.balance, 4)} {a.coin}</span>
            <div className={demoStyles.positionNums}>
              <span>${fmt(a.valueUsdt, 2)}</span>
              <span className={demoStyles.delta} data-up={a.up}>
                {a.pnl !== 0 ? (a.up ? `+$${fmt(a.pnl)}` : `-$${fmt(Math.abs(a.pnl))}`) : "0.00"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className={demoStyles.screenNote}>Spot &amp; Margin Accounts · Mone Custody</div>
    </div>
  );
}

function ActivityScreen() {
  const trades: ActivityRow[] = [
    { pair: "BTC/USDT", side: "BUY", amount: "0.8500 BTC", price: 96420.00, total: "$81,957.00", t: Date.now() - 45000 },
    { pair: "ETH/USDT", side: "SELL", amount: "4.2000 ETH", price: 2781.50, total: "$11,682.30", t: Date.now() - 180000 },
    { pair: "SOL/USDT", side: "BUY", amount: "32.0000 SOL", price: 184.20, total: "$5,894.40", t: Date.now() - 420000 },
    { pair: "BTC/USDT", side: "BUY", amount: "0.2500 BTC", price: 96390.00, total: "$24,097.50", t: Date.now() - 900000 },
    { pair: "AVAX/USDT", side: "SELL", amount: "120.0000 AVAX", price: 34.25, total: "$4,110.00", t: Date.now() - 1800000 },
  ];

  return (
    <div className={demoStyles.activityScreen}>
      <div className={demoStyles.screenNote}>Real-Time Trade Stream · Executed Order Fills</div>
      {trades.map((a, i) => (
        <div key={`${a.t}-${i}`} className={demoStyles.activityRow} data-side={a.side === "BUY" ? 1 : 2}>
          <span className={demoStyles.activityBadge} data-side={a.side === "BUY" ? 1 : 2}>
            {a.side}
          </span>
          <div className={demoStyles.activityMain}>
            <span className={demoStyles.activityPredicate}>{a.pair}</span>
            <span className={demoStyles.chipLabel}>
              {a.amount} @ ${fmt(a.price, 2)}
            </span>
          </div>
          <div className={demoStyles.activityNums}>
            <span className={demoStyles.activityValue} data-side={a.side === "BUY" ? 1 : 2}>
              {a.total}
            </span>
            <span className={demoStyles.activityWhen}>{timeAgo(a.t)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LandingHero({
  demo,
}: {
  demo: DemoData | null;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("trade");
  const [revealed, setRevealed] = useState(false);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      const idx = TABS.findIndex((t) => t.id === activeTab);
      const el = tabRefs.current[idx];
      if (el) setIndicator({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeTab]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [autoCycle, setAutoCycle] = useState(true);
  useEffect(() => {
    if (!revealed || !autoCycle) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = panelRef.current;
    if (!el) return;
    let inView = false;
    const io = new IntersectionObserver(([e]) => (inView = (e?.intersectionRatio ?? 0) >= 0.9), {
      threshold: [0, 0.9, 1],
    });
    io.observe(el);
    const t = setInterval(() => {
      if (!inView || document.hidden) return;
      setActiveTab((prev) => TABS[(TABS.findIndex((x) => x.id === prev) + 1) % TABS.length]!.id);
    }, 3000);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [revealed, autoCycle]);

  function onTabKey(e: React.KeyboardEvent) {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setAutoCycle(false);
      const next = e.key === "ArrowRight" ? (idx + 1) % TABS.length : (idx - 1 + TABS.length) % TABS.length;
      setActiveTab(TABS[next]!.id);
      tabRefs.current[next]?.focus();
    }
  }

  const glass = (children: React.ReactNode, opts: { padding: string; className?: string }) => (
    <div className={opts.className} style={{ padding: opts.padding }}>{children}</div>
  );

  return (
    <div ref={heroRef}>
      <section className={styles.hero}>
        <h1 className={`${styles.heroTitle} ${styles.heroItem} ${styles.d0}`}>
          Next-Gen Speed.
          <br />
          Institutional Power.
        </h1>

        <p className={`${styles.heroSub} ${styles.heroItem} ${styles.d1}`}>
          Sub-millisecond matching engine with deep order book liquidity. Trade spot and perpetuals at lightspeed with bank-grade security.
        </p>

        <div className={`${styles.heroItem} ${styles.d2}`}>
          <ChromeCta href="/trade/HYPE_USD" label="Start Trading on Mone" />
        </div>

        <div className={`${styles.heroItem} ${styles.d3}`}>
          <div className={styles.pillNav} role="tablist" aria-label="Mone platform preview" onKeyDown={onTabKey}>
            {indicator && (
              <span
                className={styles.pillIndicator}
                aria-hidden
                style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w }}
              />
            )}
            {TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={activeTab === t.id}
                aria-controls="landing-preview-panel"
                tabIndex={activeTab === t.id ? 0 : -1}
                data-primary={activeTab === t.id}
                onClick={() => {
                  setAutoCycle(false);
                  setActiveTab(t.id);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.panelZone}>
        <div
          ref={panelRef}
          id="landing-preview-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className={`${demoStyles.panel} ${revealed ? demoStyles.revealed : ""}`}
        >
          <div className={demoStyles.titleBar}>
            <span className={demoStyles.trafficLights} aria-hidden>
              <span className={`${demoStyles.light} ${demoStyles.lightRed}`} />
              <span className={`${demoStyles.light} ${demoStyles.lightYellow}`} />
              <span className={`${demoStyles.light} ${demoStyles.lightGreen}`} />
            </span>
            <span className={demoStyles.windowTitle}>Mone — Trading Terminal</span>
          </div>
          <div className={demoStyles.appBar}>
            <span className={demoStyles.appLogo}>
              <Image src={logoImg} alt="Mone" width={20} height={20} style={{ width: "auto", height: "auto" }} className="rounded-full object-contain" />
              Mone
            </span>
            <span className={demoStyles.appNav}>
              {TABS.map((t) => (
                <span key={t.id} data-active={activeTab === t.id}>
                  {t.label}
                </span>
              ))}
            </span>
            <span className={demoStyles.appBarRight}>
              <span className={demoStyles.portfolioChip}>
                <span className={demoStyles.chipLabel}>Balance</span>
                $215,607 USDT
              </span>
              <span className={demoStyles.avatar} aria-hidden />
            </span>
          </div>
          <div className={demoStyles.demoNote}>Mone Central Order Book · Real-Time Spot &amp; Perpetual Execution</div>

          <div className={demoStyles.screens}>
            <div key={activeTab} className={demoStyles.screen}>
              {activeTab === "trade" && (
                <TradeScreen
                  data={
                    demo ?? {
                      pair: "BTC/USDT",
                      price: 96420.50,
                      change24h: 3.42,
                      high24h: 97850.00,
                      low24h: 94120.00,
                      volume24h: "$1.82B",
                    }
                  }
                  active={revealed}
                />
              )}
              {activeTab === "markets" && <MarketsScreen />}
              {activeTab === "portfolio" && <PortfolioScreen />}
              {activeTab === "activity" && <ActivityScreen />}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
