'use client';

import { WalletContextProvider as SolanaWalletProvider } from "@/components/wallet/WalletProvider";
import { WalletContextProvider } from "@/lib/context/WalletContext";
import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <SolanaWalletProvider>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </SolanaWalletProvider>
      <Toaster position="bottom-right" />
    </>
  );
} 