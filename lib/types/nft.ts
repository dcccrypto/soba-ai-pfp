import { PublicKey } from '@solana/web3.js';
import { GenerationMetadata } from './ai';

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: NFTAttribute[];
  properties: {
    files: { uri: string; type: string; }[];
    category: string;
    creators: { address: string; share: number; }[];
  };
  generationMetadata?: GenerationMetadata;
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface MintConfig {
  price: number;
  maxSupply: number;
  royaltyBps: number;
  symbol: string;
  collection?: PublicKey;
}

export interface MintResult {
  success: boolean;
  signature?: string;
  mint?: PublicKey;
  error?: string;
} 