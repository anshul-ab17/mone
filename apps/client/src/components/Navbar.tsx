"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { ConnectWalletButton } from "./wallet/ConnectWalletButton";

const NAV_LINKS = [
  { href: "/trade", label: "Trade" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/deposit", label: "Deposit" },
];

export function Navbar() {
  const { user, signout } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/trade" ? pathname.startsWith("/trade") : pathname === href;

  return (
    <header
      className="w-full sticky top-0 z-50 border-b"
      style={{
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-[1166px] mx-auto w-full px-4 sm:px-6 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Mone home">
          <img
            src="/warriorr.png"
            alt="Mone"
            width={32}
            height={32}
            className="rounded-full object-contain"
          />
          <span className="font-bold text-base tracking-wide text-white">Mone</span>
        </Link>

        <div className="flex items-center gap-1 text-sm">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-md transition-colors font-medium"
              style={
                isActive(href)
                  ? { color: "var(--text)", background: "var(--surface-2)" }
                  : { color: "var(--text-dim)", background: "transparent" }
              }
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <ConnectWalletButton
            className="h-8 px-4 text-xs font-semibold rounded-md"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              height: 34,
              fontSize: 12,
              borderRadius: 8,
            }}
          />

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs hidden sm:block" style={{ color: "var(--text-faint)" }}>
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signout}
                className="h-8 text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text-dim)", background: "transparent" }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
            
              <Button
                size="sm"
                asChild
                className="h-8 px-4 text-xs font-semibold"
                style={{ background: "var(--text)", color: "var(--bg)" }}
              >
                <Link href="/signin">Sign in</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
