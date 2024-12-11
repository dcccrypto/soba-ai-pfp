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
  model?: string;
  go_fast?: boolean;
  lora_scale?: number;
  megapixels?: string;
  num_outputs?: number;
  aspect_ratio?: string;
  output_format?: string;
  guidance_scale?: number;
  output_quality?: number;
  prompt_strength?: number;
  extra_lora_scale?: number;
  num_inference_steps?: number;
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