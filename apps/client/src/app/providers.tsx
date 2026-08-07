"use client";

import { useCallback, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import type { WalletError } from "@solana/wallet-adapter-base";
import { WalletModalContextProvider } from "@/components/wallet/WalletModalContext";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export function SolanaProviders({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()],
    [],
  );

  const onError = useCallback((error: WalletError) => {
    // Silence expected wallet connection aborts/disconnects
    if (error?.name === "WalletConnectionError" || error?.message?.includes("Not Connected")) {
      return;
    }
    console.warn("Wallet error:", error);
  }, []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC}>
      <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
        <WalletModalContextProvider>
          {children}
          <WalletConnectModal />
        </WalletModalContextProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
