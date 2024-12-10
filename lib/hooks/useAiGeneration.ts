'use client';

import { useState, useCallback } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { GenerationParams, GenerationResult } from '../types/ai';
import toast from 'react-hot-toast';

export const useAiGeneration = () => {
  const { publicKey, hasMinBalance } = useWalletContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generateImage = useCallback(async (
    prompt: string,
    params?: Partial<GenerationParams>
  ): Promise<GenerationResult | null> => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return null;
    }

    if (!hasMinBalance) {
      toast.error('Insufficient SOBA token balance');
      return null;
    }

    try {
      setIsGenerating(true);
      setGenerationError(null);

      console.log('Sending generation request:', {
        prompt,
        params,
        userId: publicKey.toString(),
      });

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          params,
          userId: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Generation failed:', data);
        throw new Error(data.error || 'Failed to generate image');
      }

      console.log('Generation successful:', data);
      toast.success('Image generated successfully!');
      return data;
    } catch (error) {
      console.error('Generation error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate image';
      setGenerationError(message);
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [publicKey, hasMinBalance]);

  const checkQuota = useCallback(async (): Promise<{
    generationsToday: number;
    remainingToday: number;
    totalGenerations: number;
  } | null> => {
    if (!publicKey) return null;

    try {
      const response = await fetch(`/api/ai/generate?userId=${publicKey.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check quota');
      }

      return data;
    } catch (error) {
      console.error('Error checking quota:', error);
      return null;
    }
  }, [publicKey]);

  return {
    generateImage,
    checkQuota,
    isGenerating,
    generationError,
  };
}; 