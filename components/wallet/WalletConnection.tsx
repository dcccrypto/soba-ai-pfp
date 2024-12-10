'use client';

import { FC } from 'react';
import { useWalletAuth } from '@/lib/hooks/useWalletAuth';
import { WalletName } from '@solana/wallet-adapter-base';

export const WalletConnection: FC = () => {
  const {
    connected,
    connecting,
    isLoading,
    error,
    hasMinBalance,
    connectWallet,
    disconnectWallet,
    publicKey
  } = useWalletAuth();

  const handleConnect = async (walletName: WalletName) => {
    await connectWallet(walletName);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (connected && publicKey) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </p>
          {hasMinBalance ? (
            <p className="text-sm text-green-600">✓ Sufficient SOBA token balance</p>
          ) : (
            <p className="text-sm text-red-600">✗ Insufficient SOBA token balance</p>
          )}
        </div>
        <button
          onClick={() => disconnectWallet()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          disabled={isLoading}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => handleConnect('Phantom' as WalletName)}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        disabled={connecting || isLoading}
      >
        {connecting ? 'Connecting...' : 'Connect Phantom'}
      </button>
      <button
        onClick={() => handleConnect('Solflare' as WalletName)}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        disabled={connecting || isLoading}
      >
        {connecting ? 'Connecting...' : 'Connect Solflare'}
      </button>
    </div>
  );
}; 