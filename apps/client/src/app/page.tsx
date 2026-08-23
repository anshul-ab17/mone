import Link from "next/link";
import Image from "next/image";
import logoImg from "@/assets/warriorr.png";
import { Reveal } from "@/components/Reveal";
import { LandingHero } from "@/components/landing/LandingHero";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeatureIcon } from "@/components/landing/FeatureIcons";
import styles from "./landing.module.css";

const MOCK_DEMO = {
  pair: "HYPE/USD",
  price: 28.45,
  change24h: 14.82,
  high24h: 30.1,
  low24h: 24.2,
  volume24h: "$134.2M",
};

const FEATURED_PAIRS = [
  { slug: "HYPE_USD", pair: "HYPE/USD", name: "Hyperliquid", price: "$28.45", change: "+14.82%", volume: "$134.2M Vol", up: true },
  { slug: "BTC_USDC", pair: "BTC/USDC", name: "Bitcoin", price: "$96,420.50", change: "+3.42%", volume: "$1.78B Vol", up: true },
  { slug: "SOL_USDC", pair: "SOL/USDC", name: "Solana", price: "$184.60", change: "+5.82%", volume: "$580M Vol", up: true },
  { slug: "ETH_USDC", pair: "ETH/USDC", name: "Ethereum", price: "$2,780.25", change: "+2.15%", volume: "$860M Vol", up: true },
  { slug: "SUI_USDC", pair: "SUI/USDC", name: "Sui", price: "$3.45", change: "+8.65%", volume: "$84.2M Vol", up: true },
  { slug: "AVAX_USDC", pair: "AVAX/USDC", name: "Avalanche", price: "$34.10", change: "-1.24%", volume: "$122M Vol", up: false },
];

const FEATURES = [
  {
    icon: "execution",
    title: "Sub-Millisecond Execution",
    body: "In-memory order matching engine delivering <0.8ms latency and handling over 100,000 transactions per second without queue delays.",
    era: "Belgium — September 2019",
  },
  {
    icon: "liquidity",
    title: "Deep Institutional Liquidity",
    body: "Aggregated liquidity across top global market makers ensures tight spreads and zero price impact for large block trades.",
    era: "Monza — September 2019",
  },
  {
    icon: "security",
    title: "1:1 Proof of Reserves",
    body: "Customer funds are safeguarded in multi-party computation (MPC) cold vaults with real-time on-chain verifiable auditability.",
    era: "Bahrain — March 2022",
  },
  {
    icon: "futures",
    title: "Spot & Perpetual Futures",
    body: "Access high-leverage perpetual contracts up to 100x or spot trade major digital assets with multi-asset collateral support.",
    era: "Silverstone — July 2022",
  },
  {
    icon: "fees",
    title: "Ultra-Competitive Fees",
    body: "Maker fees starting from 0.02% and taker fees from 0.04% with additional VIP discounts for active algorithmic and retail traders.",
    era: "Singapore — September 2023",
  },
  {
    icon: "api",
    title: "Institutional API Suite",
    body: "High-frequency WebSocket and REST feeds plus FIX protocol connectivity designed for quantitative hedge funds and trading firms.",
    era: "Monaco — May 2024",
  },
] as const;

export default function LandingPage() {
  return (
    <div className={styles.bleed}>
      <div className={styles.skyZone}>
        <LandingHero demo={MOCK_DEMO} />
      </div>

      <div className={styles.lower}>
        <Reveal>
          <section id="features" className={styles.marketsStrip} style={{ marginTop: 24 }}>
            <h2 className={styles.stripTitle}>Built for Speed &amp; Security</h2>
            <p className={styles.faqSubtitle}>Enterprise-grade architecture tailored for pro traders and beginners alike</p>
            <div className={styles.featureMarquee}>
              <div className={styles.featureTrack}>
                {[...FEATURES, ...FEATURES].map((f, i) => (
                  <div key={`${f.title}-${i}`} className={styles.featureCard}>
                    <div className={styles.featureIcon}><FeatureIcon name={f.icon} /></div>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                    <span className={styles.featureEra}>{f.era}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <FaqSection />
        </Reveal>
      </div>

      <footer className={styles.mega}>
        <div className={styles.megaInner}>
          <div className={styles.megaCols}>
            <div className={styles.megaBrandCol}>
              <div className={styles.megaBrand}>
                <Image src={logoImg} alt="Mone" width={38} height={38} style={{ width: "auto", height: "auto" }} className="rounded-full object-contain" />
                <span>Mone</span>
              </div>
              <p className={styles.megaTagline}>
                Ultra-fast crypto trading, deep institutional liquidity, and sub-millisecond execution.
              </p>
            </div>

            <div>
              <span className={styles.megaColTitle}>Products</span>
              <Link href="/trade">Spot Trading</Link>
              <Link href="/trade">Perpetual Futures</Link>
              <Link href="/trade">Margin Trading</Link>
              <Link href="/trade">Mone Convert</Link>
            </div>
            <div>
              <span className={styles.megaColTitle}>Services</span>
              <Link href="/trade">API Documentation</Link>
              <Link href="/trade">Fee Schedule</Link>
              <Link href="/portfolio">Proof of Reserves</Link>
              <Link href="/portfolio">Institutional VIP</Link>
            </div>
            <div>
              <span className={styles.megaColTitle}>Company</span>
              <Link href="/">About Mone</Link>
              <Link href="/">Security</Link>
              <Link href="/">Careers</Link>
              <Link href="/">Terms &amp; Privacy</Link>
            </div>
          </div>

          <div className={styles.megaRule} />
          <p className={styles.megaCopy}>
            © 2026 Mone Exchange. Ultra-fast crypto trading platform.
          </p>
        </div>

        <div className={styles.megaMark} aria-hidden>
          <Image src={logoImg} alt="" width={160} height={160} style={{ width: "auto", height: "auto" }} className={styles.megaMarkGem} />
          <span className={styles.megaMarkText}>Mone</span>
        </div>
      </footer>
    </div>
  );
}
