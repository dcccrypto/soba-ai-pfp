'use client';

import { useState, useEffect } from 'react';
import { useAiGeneration } from '@/lib/hooks/useAiGeneration';
import { useWalletContext } from '@/lib/context/WalletContext';
import dynamic from 'next/dynamic';
import { NFTMint } from '@/components/NFTMint';
import { getBlockProduction, getRecentBlock } from '@/lib/services/solanaProvider';

// Dynamically import WalletMultiButton with ssr disabled
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export default function TestPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const { generate, isLoading: isGenerating, error: generationError } = useAiGeneration();
  const { publicKey } = useWalletContext();
  const [quota, setQuota] = useState<{
    generationsToday: number;
    remainingToday: number;
    totalGenerations: number;
  } | null>(null);
  const [blockInfo, setBlockInfo] = useState<any>(null);

  // Fetch quota on component mount and when publicKey changes
  useEffect(() => {
    const fetchQuota = async () => {
      if (!publicKey) return;
      
      try {
        const response = await fetch(`/api/ai/generate?userId=${publicKey.toBase58()}`);
        const data = await response.json();
        if (response.ok) {
          setQuota(data);
        }
      } catch (error) {
        console.error('Failed to fetch quota:', error);
      }
    };

    fetchQuota();
  }, [publicKey]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const result = await generate(prompt, {
      model: "dev",
      go_fast: false,
      lora_scale: 1,
      megapixels: "1",
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "webp",
      guidance_scale: 3,
      output_quality: 80,
      prompt_strength: 0.8,
      extra_lora_scale: 1,
      num_inference_steps: 28
    });

    if (result) {
      setResult(result);
      // Refresh quota after successful generation
      const response = await fetch(`/api/ai/generate?userId=${publicKey.toBase58()}`);
      const quotaData = await response.json();
      if (response.ok) {
        setQuota(quotaData);
      }
    }
  };

  // Add function to fetch Solana block info
  const fetchBlockInfo = async () => {
    try {
      const production = await getBlockProduction();
      const recentBlock = await getRecentBlock();
      setBlockInfo({ production, recentBlock });
    } catch (error) {
      console.error('Failed to fetch Solana block info:', error);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">AI Generation Test</h1>
      
      <div className="mb-4">
        <WalletMultiButton />
      </div>

      {publicKey ? (
        <>
          {quota && (
            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Generation Quota</h3>
              <p>Daily Limit: 5</p>
              <p>Remaining today: {quota.remainingToday}</p>
              <p>Used today: {quota.generationsToday}</p>
              <p>Total generations: {quota.totalGenerations}</p>
            </div>
          )}

          <div className="mb-6">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt"
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (quota?.remainingToday === 0)}
              className={`mt-2 px-4 py-2 rounded ${
                isGenerating || quota?.remainingToday === 0
                  ? 'bg-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isGenerating ? 'Generating...' : 
               quota?.remainingToday === 0 ? 'Daily limit reached' : 'Generate'}
            </button>
            {generationError && (
              <div className="mt-2 text-red-500">
                {generationError}
              </div>
            )}
          </div>

          {result && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Result:</h2>
              {result.imageUrl && (
                <div className="mb-4">
                  <img
                    src={result.imageUrl}
                    alt="Generated image"
                    className="max-w-md rounded-lg shadow-lg"
                  />
                  <NFTMint
                    generationMetadata={{
                      userId: publicKey.toBase58(),
                      prompt: prompt,
                      timestamp: new Date(),
                      imageUrl: result.imageUrl,
                      status: 'completed',
                      modelVersion: "dcccrypto/soba:e0e293b97de2af9d7ad1851c13b14e01036fa7040b6dd39eec05d18f76dcc997",
                      generationParams: result.params || {}
                    }}
                  />
                </div>
              )}
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={fetchBlockInfo}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Fetch Solana Block Info
            </button>

            {blockInfo && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Solana Block Info</h3>
                <pre className="whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(blockInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-gray-600">
          Please connect your wallet to test image generation
        </div>
      )}
    </div>
  );
} 