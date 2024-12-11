import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Metaplex, 
  walletAdapterIdentity,
  UploadMetadataInput,
  CreateNftInput,
  CreatorInput,
} from '@metaplex-foundation/js';
import { 
  Connection, 
  clusterApiUrl, 
  Keypair, 
  LAMPORTS_PER_SOL,
  PublicKey,
  Commitment,
  ConnectionConfig
} from '@solana/web3.js';
import { NFTMetadata, MintConfig, MintResult } from '../types/nft';

// Use devnet endpoints
const RPC_ENDPOINTS: Array<{
  url: string;
  config: ConnectionConfig;
}> = [
  {
    url: 'https://api.devnet.solana.com',
    config: {
      commitment: 'confirmed' as Commitment,
      confirmTransactionInitialTimeout: 120000,
    }
  },
  {
    url: clusterApiUrl('devnet'),
    config: {
      commitment: 'confirmed' as Commitment,
      confirmTransactionInitialTimeout: 120000,
    }
  }
];

export function useNFTMint() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const getWorkingConnection = async (): Promise<Connection> => {
    // First try the current connection
    try {
      if (connection) {
        await connection.getVersion();
        console.log('Using existing connection');
        return connection;
      }
    } catch (error) {
      console.warn('Current connection failed, trying fallbacks...', error);
    }

    // Try fallback endpoints
    for (const endpoint of RPC_ENDPOINTS) {
      try {
        console.log('Trying RPC endpoint:', endpoint.url);
        const conn = new Connection(endpoint.url, endpoint.config);
        await conn.getVersion();
        console.log('Successfully connected to:', endpoint.url);
        return conn;
      } catch (error) {
        console.warn(`RPC endpoint ${endpoint.url} failed:`, error);
        continue;
      }
    }
    throw new Error('All RPC endpoints failed. Please try again later.');
  };

  const mintNFT = async (
    metadata: NFTMetadata,
    config: MintConfig
  ): Promise<MintResult> => {
    if (!wallet.publicKey) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    try {
      const workingConnection = await getWorkingConnection();
      
      // Configure Metaplex
      const metaplex = Metaplex.make(workingConnection)
        .use(walletAdapterIdentity(wallet));

      // Generate a new keypair for the mint
      const mintKeypair = Keypair.generate();

      // Format metadata for Metaplex
      const metaplexMetadata: UploadMetadataInput = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: metadata.image,
        attributes: metadata.attributes.map(attr => ({
          trait_type: attr.trait_type,
          value: attr.value
        })),
        properties: {
          files: metadata.properties.files.map(file => ({
            uri: file.uri,
            type: file.type
          })),
          category: metadata.properties.category,
          creators: metadata.properties.creators.map(creator => ({
            address: creator.address,
            share: creator.share
          }))
        }
      };

      // Upload metadata
      console.log('Uploading metadata...');
      const { uri } = await metaplex.nfts().uploadMetadata(metaplexMetadata);
      console.log('Metadata uploaded:', uri);

      // Create NFT with proper types
      console.log('Creating NFT...');
      const creators: CreatorInput[] = [{
        address: wallet.publicKey,
        share: 100
      }];

      const { nft } = await metaplex.nfts().create({
        uri,
        name: metadata.name,
        sellerFeeBasisPoints: config.royaltyBps,
        symbol: config.symbol,
        creators,
        maxSupply: config.maxSupply || null,
        useNewMint: mintKeypair,
      });

      console.log('NFT created successfully:', nft.address.toBase58());
      
      return {
        success: true,
        signature: nft.address.toBase58(),
        mint: nft.address
      };

    } catch (error) {
      console.error('Minting error:', error);
      const errorMessage = error instanceof Error 
        ? error.message
        : 'Unknown minting error';
      
      if (errorMessage.includes('insufficient funds')) {
        return {
          success: false,
          error: 'Insufficient SOL balance for minting. Please ensure you have enough SOL in your wallet.'
        };
      }
      
      return {
        success: false,
        error: `Minting failed: ${errorMessage}`
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mintNFT,
    isLoading
  };
} 