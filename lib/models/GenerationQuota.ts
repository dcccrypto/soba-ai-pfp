import mongoose from 'mongoose';
import { UserGenerationQuota } from '../types/ai';

const GenerationQuotaSchema = new mongoose.Schema<UserGenerationQuota>({
  userId: { type: String, required: true, unique: true },
  generationsToday: { type: Number, default: 0 },
  lastGenerationDate: { type: Date, default: Date.now },
  totalGenerations: { type: Number, default: 0 }
}, {
  timestamps: true,
});

// Reset daily quota if it's a new day
GenerationQuotaSchema.pre('save', function(next) {
  const now = new Date();
  const last = this.lastGenerationDate;

  if (now.getUTCDate() !== last.getUTCDate() ||
      now.getUTCMonth() !== last.getUTCMonth() ||
      now.getUTCFullYear() !== last.getUTCFullYear()) {
    this.generationsToday = 0;
  }
  
  next();
});

export const GenerationQuota = mongoose.models.GenerationQuota || 
  mongoose.model<UserGenerationQuota>('GenerationQuota', GenerationQuotaSchema); 