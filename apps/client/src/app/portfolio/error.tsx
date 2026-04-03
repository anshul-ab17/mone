"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PortfolioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Portfolio error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center flex-col gap-4 text-center px-4">
      <p className="text-[#555] text-sm">Something went wrong loading your portfolio.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm border border-[#2a2a2a] text-[#888] hover:text-white transition-colors"
        >
          Retry
        </button>
        <Link href="/trade"
          className="px-4 py-2 rounded-lg text-sm text-white hover:opacity-90 transition-opacity"
          style={{ background: "#800020" }}
        >
          Go to Trade
        </Link>
      </div>
    </div>
  );
}
