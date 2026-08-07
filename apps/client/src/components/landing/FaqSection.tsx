"use client";

import { useState } from "react";
import styles from "@/app/landing.module.css";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "What is Mone Exchange?",
    answer:
      "Mone is a high-performance centralized cryptocurrency exchange engineered for speed, deep institutional liquidity, and security. We offer spot, perpetual futures, and margin trading powered by an in-memory matching engine.",
  },
  {
    question: "How does Mone ensure asset security and solvency?",
    answer:
      "All user funds are held 1:1 in multi-party computation (MPC) cold storage wallets. Mone does not lend or hypothecate customer deposits and provides cryptographically verified, real-time Proof of Reserves.",
  },
  {
    question: "What are Mone's trading fees?",
    answer:
      "Mone offers competitive maker-taker fee structures starting at 0.02% maker and 0.04% taker for spot trading, with generous discounts for high-volume traders and VIP tiers.",
  },
  {
    question: "How fast is order execution on Mone?",
    answer:
      "Our memory-first matching engine achieves sub-millisecond execution times (<0.8ms average latency) capable of processing over 100,000 transactions per second without throughput bottlenecks.",
  },
  {
    question: "What trading instruments and order types are supported?",
    answer:
      "Mone supports Spot, Perpetual Swaps with up to 100x leverage, and Margin trading. Available order types include Market, Limit, Stop-Limit, Take-Profit, Trailing Stop, and OCO (One-Cancels-the-Other).",
  },
  {
    question: "How do deposits and withdrawals work?",
    answer:
      "Mone supports instant deposits and withdrawals across 100+ cryptocurrencies and major fiat payment rails including SEPA, SWIFT, and card on-ramps with automated security verification.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className={styles.faqSection}>
      <h2 className={styles.stripTitle}>Frequently Asked Questions</h2>
      <p className={styles.faqSubtitle}>Everything you need to know about trading on Mone</p>

      <div className={styles.faqList}>
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={faq.question}
              className={`${styles.faqCard} ${isOpen ? styles.faqOpen : ""}`}
              onClick={() => toggle(i)}
            >
              <button
                type="button"
                className={styles.faqQuestion}
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <span className={styles.faqIcon} aria-hidden>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
              {isOpen && <p className={styles.faqAnswer}>{faq.answer}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
