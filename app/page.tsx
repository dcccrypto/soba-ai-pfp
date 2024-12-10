'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletInit } from '@/components/wallet/WalletInit';

export default function Home() {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (connected) {
      console.log('[%s] Wallet connected: %s', new Date().toISOString(), publicKey?.toBase58());
    } else {
      console.log('[%s] Wallet disconnected', new Date().toISOString());
    }
  }, [publicKey, connected]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <WalletInit />
    </main>
  );
}
