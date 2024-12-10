export type GenerationQuota = {
  id: string;
  user_id: string;
  generations_today: number;
  last_generation_date: string;
  total_generations: number;
  created_at: string;
  updated_at: string;
};

export type GenerationRecord = {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  status: 'pending' | 'completed' | 'failed';
  model_version: string;
  generation_params: Record<string, any>;
  created_at: string;
  updated_at: string;
}; 