'use client';

import { useState } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { GenerationParams, GenerationResult } from '../types/ai';
import { updateUserStats } from '../server/postgres';

export function useAiGeneration() {
  const { publicKey } = useWalletContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (prompt: string, params?: GenerationParams): Promise<GenerationResult | null> => {
    if (!publicKey) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if server is running first
      try {
        await fetch('/api/health');
      } catch (e) {
        throw new Error('API server is not running. Please start the development server with `npm run dev`');
      }

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          params,
          userId: publicKey.toBase58(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.success && data.imageUrl) {
        // Update user stats after successful generation
        try {
          const statsResponse = await fetch('/api/user/update-stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: publicKey.toBase58(),
              incrementUsed: 1,
            }),
          });

          if (!statsResponse.ok) {
            console.warn('Failed to update user stats:', await statsResponse.text());
          }
        } catch (statsError) {
          console.warn('Failed to update user stats:', statsError);
        }

        return {
          success: true,
          imageUrl: data.imageUrl,
          params: data.params,
        };
      }

      throw new Error(data.error || 'Generation failed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Generation error:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generate,
    isLoading,
    error,
  };
} 