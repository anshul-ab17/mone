"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModalContext } from "./WalletModalContext";
import styles from "./WalletModal.module.css";

export function WalletConnectModal() {
  const { wallets, select } = useWallet();
  const { open, setOpen } = useWalletModalContext();

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);

  if (!open) return null;

  const installable = wallets.filter((w) => w.readyState === "Installed" || w.readyState === "Loadable");
  const detectable = wallets.filter((w) => w.readyState === "NotDetected");

  const Row = ({ w }: { w: (typeof wallets)[number] }) => (
    <button
      key={w.adapter.name}
      type="button"
      className={styles.row}
      onClick={() => {
        select(w.adapter.name);
        setOpen(false);
      }}
    >
      <span className={styles.rowIcon}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={w.adapter.icon} alt="" width={28} height={28} />
      </span>
      <span className={styles.rowName}>{w.adapter.name}</span>
    </button>
  );

  return (
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label="Choose Wallet" onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Choose Wallet</h2>
          <button type="button" className={styles.close} aria-label="Close" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>

        <p className={styles.subtitle}>Connect a wallet on Solana to continue</p>

        <div className={styles.list}>
          {installable.map((w) => (
            <Row key={w.adapter.name} w={w} />
          ))}
          {detectable.length > 0 && (
            <>
              <div className={styles.divider}>Not installed</div>
              {detectable.map((w) => (
                <Row key={w.adapter.name} w={w} />
              ))}
            </>
          )}
        </div>

        <p className={styles.footer}>
          What is a Solana wallet? A self-custody wallet lets you securely store, send, and receive
          digital assets on the Solana network.
        </p>
      </div>
    </div>
  );
}
