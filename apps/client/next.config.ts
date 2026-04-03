import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Solana packages ship CJS — Next needs to transpile them for the browser
  transpilePackages: [
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-wallets",
    "@solana/wallet-adapter-backpack",
  ],
};

export default nextConfig;
