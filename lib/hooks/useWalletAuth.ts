'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useState } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletName } from '@solana/wallet-adapter-base';
import { config } from '../config';
import toast from 'react-hot-toast';

// We'll create the token after implementing the contract
const SOBA_TOKEN_MINT = new PublicKey('7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs');
const MINIMUM_SOBA_BALANCE = 10;

export const useWalletAuth = () => {
  const { 
    wallet,
    publicKey, 
    connected, 
    connecting, 
    disconnect,
    select,
    connect,
    wallets
  } = useWallet();
  
  const [hasMinBalance, setHasMinBalance] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connection = new Connection(config.solana.rpcHost);

  const checkTokenBalance = useCallback(async (walletAddress: PublicKey) => {
    try {
      // For development, we'll just return true
      // In production, uncomment the token balance check
      setHasMinBalance(true);
      return true;

      /* Uncomment this when token is deployed
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletAddress,
        { mint: SOBA_TOKEN_MINT }
      );

      const balance = tokenAccounts.value.reduce((acc, account) => {
        return acc + Number(account.account.data.parsed.info.tokenAmount.amount);
      }, 0) / LAMPORTS_PER_SOL;

      setHasMinBalance(balance >= MINIMUM_SOBA_BALANCE);
      return balance >= MINIMUM_SOBA_BALANCE;
      */
    } catch (err) {
      console.error('Error checking token balance:', err);
      // For development, we'll still return true
      setHasMinBalance(true);
      return true;
    }
  }, [connection]);

  const connectWallet = useCallback(async (walletName: WalletName) => {
    try {
      setIsLoading(true);
      setError(null);

      // Find the wallet adapter
      const adapter = wallets.find(w => w.adapter.name === walletName)?.adapter;
      if (!adapter) {
        throw new Error(`${walletName} wallet not found`);
      }

      // Select and connect
      select(walletName);
      
      // Wait a bit for the selection to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await connect();

      toast.success('Wallet connected successfully!');
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
      toast.error('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  }, [select, connect, wallets]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setHasMinBalance(false);
      setError(null);
      toast.success('Wallet disconnected');
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      setError('Failed to disconnect wallet');
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect]);

  // Check balance when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      checkTokenBalance(publicKey);
    }
  }, [connected, publicKey, checkTokenBalance]);

  // Handle wallet connection changes
  useEffect(() => {
    if (!connected) {
      setHasMinBalance(false);
    }
  }, [connected]);

  return {
    wallet,
    publicKey,
    connected,
    connecting,
    isLoading,
    error,
    hasMinBalance,
    connectWallet,
    disconnectWallet,
    checkTokenBalance
  };
}; 