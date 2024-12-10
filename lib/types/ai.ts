import { PublicKey } from '@solana/web3.js';

export interface GenerationMetadata {
  userId: string;
  prompt: string;
  timestamp: Date;
  imageUrl: string;
  status: 'pending' | 'completed' | 'failed';
  modelVersion: string;
  generationParams: GenerationParams;
}

export interface GenerationParams {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
}

export interface UserGenerationQuota {
  userId: string;
  generationsToday: number;
  lastGenerationDate: Date;
  totalGenerations: number;
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: GenerationMetadata;
} 