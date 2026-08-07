"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/assets/warriorr.png";
import { type MarketInfo, MARKETS } from "@/lib/markets";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "@/app/trade/trade.module.css";

export function TradeHeader({ market }: { market: MarketInfo }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredMarkets = Object.values(MARKETS).filter(
    (m) =>
      m.slug.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isUp = market.change24h >= 0;

  return (
    <header className={styles.topTickerBar}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff", marginRight: 12 }}>
        <Image src={logoImg} alt="Mone" width={28} height={28} style={{ objectFit: "contain", borderRadius: 4 }} priority />
        <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.04em" }}>Mone</span>
      </Link>

      <div style={{ position: "relative" }}>
        <div
          className={styles.marketPicker}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className={styles.coinIcon}>{market.base.slice(0, 3)}</div>
          <span className={styles.pairTitle}>
            {market.base}/{market.quote}
          </span>
          <span className={styles.perpBadge}>PERP</span>
          <span style={{ fontSize: "0.6rem", color: "#788296" }}>▼</span>
        </div>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 6,
              width: 320,
              background: "#11151e",
              border: "1px solid #222834",
              borderRadius: 12,
              padding: 10,
              zIndex: 200,
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            }}
          >
            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "#181f2c",
                border: "1px solid #2b3444",
                borderRadius: 6,
                padding: "7px 10px",
                color: "#fff",
                fontSize: "0.82rem",
                outline: "none",
                marginBottom: 8,
              }}
              autoFocus
            />

            <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
              {filteredMarkets.map((m) => (
                <Link
                  key={m.slug}
                  href={`/trade/${m.slug}`}
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 6,
                    textDecoration: "none",
                    background: m.slug === market.slug ? "#1c2332" : "transparent",
                    color: "#fff",
                    fontSize: "0.82rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700 }}>{m.base}/{m.quote}</span>
                    <span style={{ fontSize: "0.7rem", color: "#647087" }}>{m.name}</span>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                    <div>${m.price.toFixed(m.decimals)}</div>
                    <div style={{ fontSize: "0.7rem", color: m.change24h >= 0 ? "#00c087" : "#f84960" }}>
                      {m.change24h >= 0 ? "+" : ""}{m.change24h.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.mainPriceSection}>
        <span className={`${styles.currentPrice} ${isUp ? styles.priceGreen : styles.priceRed}`}>
          ${market.price.toFixed(market.decimals)}
        </span>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: isUp ? "#00c087" : "#f84960" }}>
          {isUp ? "+" : ""}{market.change24h.toFixed(2)}%
        </span>
      </div>

      <div className={styles.statGroup}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>24h High</span>
          <span className={styles.statValue}>${market.high24h.toFixed(market.decimals)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>24h Low</span>
          <span className={styles.statValue}>${market.low24h.toFixed(market.decimals)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>24h Volume ({market.base})</span>
          <span className={styles.statValue}>{market.volume24h}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>24h Turnover</span>
          <span className={styles.statValue}>{market.turnover24h}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Funding / Countdown</span>
          <span className={styles.statValue} style={{ color: "#6ee7ff" }}>
            {market.fundingRate} <span style={{ color: "#788296", fontSize: "0.7rem" }}>{market.countdown}</span>
          </span>
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="#deposit"
          style={{
            padding: "5px 12px",
            borderRadius: 6,
            background: "rgba(110, 231, 255, 0.12)",
            color: "#6ee7ff",
            fontSize: "0.78rem",
            fontWeight: 700,
            textDecoration: "none",
            border: "1px solid rgba(110, 231, 255, 0.3)",
          }}
        >
          Deposit
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
