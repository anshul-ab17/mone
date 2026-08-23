import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaProviders } from "./providers";
import { AuthProvider } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { NO_FLASH_SCRIPT } from "../components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Mone | Centralized Exchange",
  description:
    "Mone — Ultra-fast crypto trading, deep institutional liquidity, and sub-millisecond execution.",
  icons: {
    icon: "/waarrr.png",
    shortcut: "/waarrr.png",
    apple: "/waarrr.png",
  },
  openGraph: {
    title: "Mone | Next-Gen Crypto Exchange",
    description:
      "Mone — Ultra-fast crypto trading, deep institutional liquidity, and sub-millisecond execution.",
    images: [{ url: "/waarrr.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="icon" href="/waarrr.png" sizes="any" />
        <link rel="apple-touch-icon" href="/waarrr.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <Script id="no-flash-theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
        <SolanaProviders>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </SolanaProviders>
      </body>
    </html>
  );
}
