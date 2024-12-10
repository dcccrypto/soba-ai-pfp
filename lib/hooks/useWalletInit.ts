import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export const useWalletInit = () => {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    const initializeUser = async () => {
      if (!publicKey || !connected) return;

      const userId = publicKey.toBase58();
      console.log('Checking wallet initialization:', userId);

      try {
        // First check if user has required SOBA tokens
        const verifyResponse = await fetch(`/api/nft/verify?userId=${userId}`);
        const verifyData = await verifyResponse.json();

        if (!verifyData.hasNft) {
          console.log(`Insufficient SOBA tokens. Required: ${verifyData.minimumRequired}, Current: ${verifyData.balance}`);
          return;
        }

        // Then check user stats
        const statsResponse = await fetch(`/api/user/stats?userId=${userId}`);
        
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json();
          console.error('Failed to get user stats:', errorData);
          return;
        }

        const statsData = await statsResponse.json();

        // If no quota exists and user has enough tokens, create one
        if (!statsData.quota && verifyData.hasNft) {
          console.log('Creating new quota for verified user:', userId);
          
          const initResponse = await fetch('/api/user/init', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });

          if (!initResponse.ok) {
            const errorData = await initResponse.json();
            console.error('Failed to initialize user:', errorData);
            return;
          }

          const initData = await initResponse.json();
          console.log('Created new quota:', initData);
        } else {
          console.log('Found existing quota:', statsData.quota);
        }
      } catch (err) {
        console.error('Error in wallet initialization:', err);
      }
    };

    initializeUser();
  }, [publicKey, connected]);

  return null;
}; 