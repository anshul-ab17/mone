"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type DepositEntry = {
  signature: string;
  amount: number;
  asset: string;
  createdAt: string;
};

export default function DepositPage() {
  const { connected, publicKey } = useWallet();
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>("devnet");
  const [history, setHistory] = useState<DepositEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepositInfo();
  }, []);

  async function fetchDepositInfo() {
    try {
      const [addrRes, histRes] = await Promise.all([
        fetch(`${API}/api/deposit/address`, { credentials: "include" }),
        fetch(`${API}/api/deposit/history`, { credentials: "include" }),
      ]);

      if (addrRes.ok) {
        const { publicKey, network } = await addrRes.json();
        setDepositAddress(publicKey);
        setNetwork(network);
      } else {
        const { error } = await addrRes.json();
        setError(error);
      }

      if (histRes.ok) {
        const { deposits } = await histRes.json();
        setHistory(deposits);
      }
    } catch {
      setError("Failed to load deposit info");
    }
  }

  function copyAddress() {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="flex-1 bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Deposit SOL</h1>
          <WalletMultiButton />
        </div>

        {/* Connected wallet indicator */}
        {connected && publicKey && (
          <p className="text-sm text-gray-400">
            Connected: {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
          </p>
        )}

        {/* Deposit address card */}
        {error ? (
          <div className="bg-[#1a0a0a] border border-red-900/50 rounded-lg p-4 text-red-400 text-sm space-y-1">
            <p className="font-medium">⚠ Deposits unavailable</p>
            <p className="text-[#888]">{error}</p>
            <p className="text-[#555] text-xs pt-1">
              The exchange operator needs to configure <code className="text-[#666]">SOLANA_MASTER_SECRET</code> to enable deposits.
            </p>
          </div>
        ) : depositAddress ? (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded font-mono uppercase">
                {network}
              </span>
              <span className="text-sm text-gray-400">Your SOL deposit address</span>
            </div>

            <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
              <span className="font-mono text-sm break-all flex-1 text-green-400">
                {depositAddress}
              </span>
              <button
                onClick={copyAddress}
                className="shrink-0 text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Send SOL to this address from any Solana wallet. Deposits are detected
              automatically within ~10 seconds on {network}.
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-48 mb-3" />
            <div className="h-10 bg-gray-700 rounded" />
          </div>
        )}

        {/* Deposit history */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Deposit History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No deposits yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((d) => (
                <div
                  key={d.signature}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
                >
                  <div>
                    <span className="text-green-400 font-mono font-semibold">
                      +{d.amount.toFixed(6)} {d.asset}
                    </span>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {d.signature.slice(0, 16)}…
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(d.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
