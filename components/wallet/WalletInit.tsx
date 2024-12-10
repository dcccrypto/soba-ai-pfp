'use client';

import { useEffect, useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function WalletInit() {
  const { publicKey, connected } = useWallet();
  const [verificationData, setVerificationData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    const initializeUser = async () => {
      if (!publicKey || !connected || initializingRef.current) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        initializingRef.current = true;
        const userId = publicKey.toBase58();
        console.log('[Wallet] Starting initialization for:', userId);

        // First check if user has required SOBA tokens
        console.log('[Wallet] Verifying SOBA tokens...');
        const verifyResponse = await fetch(`/api/nft/verify?userId=${userId}`);
        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          console.error('[Wallet] Token verification failed:', errorData);
          setError(errorData.details || 'Failed to verify token balance');
          return;
        }
        const verifyData = await verifyResponse.json();
        console.log('[Wallet] Token verification result:', verifyData);
        setVerificationData(verifyData);

        if (!verifyData.hasNft) {
          console.log(`[Wallet] Insufficient SOBA tokens. Required: ${verifyData.minimumRequired}, Current: ${verifyData.balance}`);
          return;
        }

        // Then check user stats
        console.log('[Wallet] Checking user stats...');
        const statsResponse = await fetch(`/api/user/stats?userId=${userId}`);
        
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json();
          console.error('[Wallet] Failed to get user stats:', errorData);
          setError('Failed to fetch user stats');
          return;
        }

        const statsData = await statsResponse.json();
        console.log('[Wallet] User stats:', statsData);
        setUserStats(statsData);

        // If no quota exists and user has enough tokens, create one
        if (!statsData.quota && verifyData.hasNft) {
          console.log('[Wallet] Creating new quota for verified user:', userId);
          
          const initResponse = await fetch('/api/user/init', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });

          if (!initResponse.ok) {
            const errorData = await initResponse.json();
            console.error('[Wallet] Failed to initialize user:', errorData);
            setError('Failed to initialize user quota');
            return;
          }

          const initData = await initResponse.json();
          setUserStats(initData);
          console.log('[Wallet] Created new quota:', initData);
        } else {
          console.log('[Wallet] Found existing quota:', statsData.quota);
        }
      } catch (err) {
        console.error('[Wallet] Error in initialization:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
      } finally {
        setLoading(false);
        initializingRef.current = false;
      }
    };

    // Add retry logic for initialization
    const retryInitialization = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          await initializeUser();
          break;
        } catch (error) {
          if (i === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    };

    retryInitialization().catch(err => {
      console.error('[Wallet] All retry attempts failed:', err);
      setError('Failed to initialize after multiple attempts');
    });
  }, [publicKey, connected]);

  if (!connected) {
    return null;
  }

  return (
    <div className="text-sm space-y-2">
      {loading && (
        <p className="text-blue-500">Loading wallet data...</p>
      )}
      
      {error && (
        <p className="text-red-500">Error: {error}</p>
      )}
      
      {verificationData && !verificationData.hasNft && (
        <p className="text-red-500">
          Insufficient SOBA tokens. Required: {verificationData.minimumRequired}, Current: {verificationData.balance}
        </p>
      )}
      
      {userStats && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p>Daily Quota: {userStats.quota}</p>
          <p>Used Today: {userStats.used}</p>
          <p>Remaining: {userStats.quota - userStats.used}</p>
        </div>
      )}
    </div>
  );
} 