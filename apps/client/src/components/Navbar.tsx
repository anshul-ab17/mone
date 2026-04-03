"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

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
    <nav className="h-14 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center px-6 gap-8 shrink-0">
      <Link href="/" className="font-bold text-lg tracking-widest text-white shrink-0">
        <span style={{ color: "#800020" }}>M</span>O<span style={{ color: "#800020" }}>N</span>E
      </Link>

      <div className="flex items-center gap-1 text-sm">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              isActive(href)
                ? "text-white bg-[#1a1a1a]"
                : "text-[#666] hover:text-[#aaa] hover:bg-[#141414]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <WalletMultiButton
          style={{ height: 34, fontSize: 12, background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8 }}
        />

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#555] hidden sm:block">{user.email}</span>
            <Button
              variant="outline" size="sm"
              onClick={signout}
              className="text-xs border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#444] bg-transparent h-8"
            >
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild
              className="text-xs text-[#666] hover:text-white hover:bg-[#141414] h-8"
            >
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button size="sm" asChild
              className="text-xs bg-white text-black hover:bg-white/90 font-semibold h-8 px-4"
            >
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
