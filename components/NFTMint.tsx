'use client';

import { useState } from 'react';
import { useNFTMint } from '@/lib/hooks/useNFTMint';
import { useWalletContext } from '@/lib/context/WalletContext';
import { GenerationMetadata } from '@/lib/types/ai';
import { NFTMetadata } from '@/lib/types/nft';

interface NFTMintProps {
  generationMetadata: GenerationMetadata;
}

export function NFTMint({ generationMetadata }: NFTMintProps) {
  const { mintNFT, isLoading } = useNFTMint();
  const { publicKey } = useWalletContext();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMint = async () => {
    if (!publicKey) return;

    setError(null);
    setSuccess(false);

    const metadata: NFTMetadata = {
      name: `SOBA AI #${Date.now()}`,
      symbol: 'SOBA',
      description: `AI-generated artwork using prompt: ${generationMetadata.prompt}`,
      image: generationMetadata.imageUrl,
      attributes: [
        {
          trait_type: 'Model',
          value: generationMetadata.modelVersion
        },
        {
          trait_type: 'Prompt',
          value: generationMetadata.prompt
        }
      ],
      properties: {
        files: [{
          uri: generationMetadata.imageUrl,
          type: 'image/webp'
        }],
        category: 'image',
        creators: [{
          address: publicKey.toBase58(),
          share: 100
        }]
      },
      generationMetadata
    };

    const result = await mintNFT(metadata, {
      price: 0,
      maxSupply: 1,
      royaltyBps: 500, // 5%
      symbol: 'SOBA'
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Minting failed');
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleMint}
        disabled={isLoading || !publicKey}
        className={`px-4 py-2 rounded-md ${
          isLoading
            ? 'bg-gray-400'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-semibold`}
      >
        {isLoading ? 'Minting...' : 'Mint as NFT'}
      </button>

      {error && (
        <div className="mt-4 text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 text-green-500">
          Successfully minted your NFT!
        </div>
      )}
    </div>
  );
} 