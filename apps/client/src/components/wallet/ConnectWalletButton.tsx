"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModalContext } from "./WalletModalContext";

export function ConnectWalletButton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { connected, publicKey, disconnect } = useWallet();
  const { setOpen } = useWalletModalContext();

  if (connected && publicKey) {
    const addr = publicKey.toBase58();
    return (
      <button
        type="button"
        className={className}
        style={style}
        title="Click to disconnect"
        onClick={() => disconnect()}
      >
        {addr.slice(0, 4)}…{addr.slice(-4)}
      </button>
    );
  }

  return (
    <button type="button" className={className} style={style} onClick={() => setOpen(true)}>
      Connect Wallet
    </button>
  );
}
