import { GenerationParams, GenerationResult } from '../types/ai';
import { config } from '../config';
import { supabase } from '../utils/supabase';
import axios from 'axios';

const REPLICATE_API_ENDPOINT = 'https://api.replicate.com/v1/predictions';
const MODEL_VERSION = config.ai.modelVersion;

export class AiService {
  private headers: Record<string, string>;

  constructor() {
    if (!config.ai.replicateApiToken) {
      throw new Error('Replicate API token is not configured');
    }

    this.headers = {
      'Authorization': `Bearer ${config.ai.replicateApiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async storeGenerationRecord(
    userId: string,
    prompt: string,
    imageUrl: string,
    params?: Partial<GenerationParams>
  ) {
    console.log('Storing generation record:', { userId, prompt, imageUrl });
    
    const record = {
      user_id: userId,
      prompt,
      image_url: imageUrl,
      status: 'completed',
      model_version: MODEL_VERSION,
      generation_params: params || {}
    };

    const { data, error } = await supabase
      .from('generation_records')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Failed to store generation record:', error);
      throw error;
    }

    console.log('Successfully stored generation record:', data);
    return data;
  }

  private async updateQuota(userId: string) {
    console.log('Updating quota for user:', userId);

    // First try to get existing quota
    const { data: existing } = await supabase
      .from('generation_quotas')
      .select('generations_today, total_generations')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Current quota:', existing);

    const newQuota = {
      user_id: userId,
      generations_today: (existing?.generations_today || 0) + 1,
      last_generation_date: new Date().toISOString(),
      total_generations: (existing?.total_generations || 0) + 1
    };

    const { data, error } = await supabase
      .from('generation_quotas')
      .upsert([newQuota])
      .select()
      .single();

    if (error) {
      console.error('Failed to update quota:', error);
      throw error;
    }

    console.log('Updated quota:', data);
    return data;
  }

  async generateImage(
    userId: string,
    prompt: string,
    params?: Partial<GenerationParams>
  ): Promise<GenerationResult> {
    try {
      console.log('Starting generation with prompt:', prompt);
      console.log('Using model version:', MODEL_VERSION);

      const requestBody = {
        version: MODEL_VERSION,
        input: {
          prompt: prompt.trim(),
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
          output_format: "webp"
        }
      };
      console.log('Request body:', requestBody);

      // Call Replicate API
      const response = await axios.post(
        REPLICATE_API_ENDPOINT,
        requestBody,
        { headers: this.headers }
      );

      console.log('Replicate API response:', response.data);

      // Wait for the prediction to complete
      const prediction = await this.waitForPrediction(response.data.id);
      console.log('Prediction completed:', prediction);

      if (!prediction.output || prediction.output.length === 0) {
        throw new Error('No output generated from Replicate');
      }

      // Get the generated image URL directly from Replicate
      const imageUrl = prediction.output[0];
      console.log('Generated image URL:', imageUrl);

      // Store the generation record with the direct URL
      const record = await this.storeGenerationRecord(userId, prompt, imageUrl, params);
      console.log('Stored generation record:', record);

      // Update the user's quota
      const quota = await this.updateQuota(userId);
      console.log('Updated quota:', quota);

      return {
        success: true,
        imageUrl: imageUrl,
        metadata: {
          userId,
          prompt,
          timestamp: new Date().toISOString(),
          imageUrl: imageUrl,
          status: 'completed',
          modelVersion: MODEL_VERSION,
          generationParams: params || {}
        }
      };
    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image',
      };
    }
  }

  private async waitForPrediction(id: string) {
    const maxAttempts = 60;
    const delayMs = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await axios.get(`${REPLICATE_API_ENDPOINT}/${id}`, {
        headers: this.headers
      });

      console.log(`Prediction status (attempt ${attempts + 1}):`, response.data.status);

      if (response.data.status === 'succeeded') {
        return response.data;
      }

      if (response.data.status === 'failed') {
        throw new Error('Prediction failed');
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempts++;
    }

    throw new Error('Prediction timed out');
  }

  private enhancePrompt(prompt: string): string {
    return prompt.trim();
  }
} 