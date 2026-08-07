"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface WalletModalCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<WalletModalCtx>({ open: false, setOpen: () => {} });

export function WalletModalContextProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export const useWalletModalContext = () => useContext(Ctx);
