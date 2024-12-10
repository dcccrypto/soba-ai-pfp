'use client';

import { createContext, useContext, FC, ReactNode } from 'react';
import { useWalletAuth } from '../hooks/useWalletAuth';
import { PublicKey } from '@solana/web3.js';

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  hasMinBalance: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: (walletName: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const walletAuth = useWalletAuth();

  return (
    <WalletContext.Provider value={walletAuth}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletContextProvider');
  }
  return context;
}; 