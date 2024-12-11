import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { config } from '../config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_DAILY_QUOTA = 10;

// Database configuration
const DB_CONFIG = {
  connectionString: process.env.POSTGRES_URL || config.supabase.url,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  application_name: 'soba-ai-pfp',
  keepAlive: true,
  keepAliveInitialDelayMillis: 1000,
  statement_timeout: 15000,
  query_timeout: 15000,
  allowExitOnIdle: true
};

console.log('[DB] Initializing database connection with config:', {
  ...DB_CONFIG,
  connectionString: DB_CONFIG.connectionString?.replace(/:[^:@]+@/, ':***@') // Hide password in logs
});

// Add this near the top of the file
const handleDatabaseError = (error: any) => {
  console.error('[DB] Database error:', error);
  
  // Check if it's a connection error
  if (error.message.includes('timeout') || error.message.includes('Connection terminated')) {
    return new Error('Database connection failed. Please try again later.');
  }
  
  // For other errors, return a generic message
  return new Error('Database operation failed');
};

// Create a singleton pool instance
export class DatabasePool {
  private static instance: Pool | null = null;
  private static isInitialized = false;
  private static initializationPromise: Promise<void> | null = null;

  public static getInstance(): Pool {
    if (!DatabasePool.instance) {
      console.log('[DB] Creating new database pool instance');
      DatabasePool.instance = new Pool(DB_CONFIG);
      
      // Add event handlers
      DatabasePool.instance.on('error', (err) => {
        console.error('[DB] Unexpected error on idle client:', err);
      });

      DatabasePool.instance.on('connect', () => {
        console.log('[DB] Connected to PostgreSQL database');
      });

      DatabasePool.instance.on('acquire', () => {
        console.log('[DB] Client acquired from pool');
      });

      DatabasePool.instance.on('remove', () => {
        console.log('[DB] Client removed from pool');
      });
    }
    return DatabasePool.instance;
  }

  public static async initialize() {
    if (DatabasePool.isInitialized) {
      return;
    }

    if (DatabasePool.initializationPromise) {
      return DatabasePool.initializationPromise;
    }

    DatabasePool.initializationPromise = (async () => {
      const pool = DatabasePool.getInstance();
      console.log('[DB] Testing database connection...');

      let retries = 3;
      let delay = 2000;
      
      while (retries > 0) {
        try {
          const client = await pool.connect();
          try {
            const result = await client.query('SELECT NOW()');
            console.log('[DB] Database connection test successful:', result.rows[0]);
            
            await initializeTables(client);
            DatabasePool.isInitialized = true;
            return;
          } finally {
            client.release();
          }
        } catch (err) {
          retries--;
          if (retries === 0) {
            console.error('[DB] Database connection test failed after all retries:', err);
            throw err;
          }
          console.warn(`[DB] Connection attempt failed, ${retries} retries remaining:`, err);
          
          delay = Math.min(delay * 1.5, 10000);
          const jitter = Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }
      }
    })();

    return DatabasePool.initializationPromise;
  }

  public static async query(text: string, params?: any[]) {
    if (!DatabasePool.isInitialized) {
      await DatabasePool.initialize();
    }

    const pool = DatabasePool.getInstance();
    return executeWithRetry(async () => {
      const result = await pool.query(text, params);
      return result;
    });
  }
}

// Initialize tables if they don't exist
async function initializeTables(client: any) {
  console.log('[DB] Starting database initialization');
  const startTime = Date.now();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS generation_quotas (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        generations_today INTEGER NOT NULL DEFAULT 0,
        total_generations INTEGER NOT NULL DEFAULT 0,
        last_generation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS generation_records (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        image_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        model_version TEXT NOT NULL,
        generation_params JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const duration = Date.now() - startTime;
    console.log(`[DB] Database tables initialized successfully in ${duration}ms`);
  } catch (err) {
    console.error('[DB] Error initializing database tables:', err);
    throw err;
  }
}

// Initialize database connection
DatabasePool.initialize().catch(err => {
  console.error('[DB] Fatal error during initialization:', err);
});

export interface GenerationQuota {
  generations_today: number;
  total_generations: number;
  last_generation_date: Date;
  quota: number;
  used: number;
}

export interface GenerationRecord {
  id: number;
  user_id: string;
  prompt: string;
  image_url: string;
  status: string;
  model_version: string;
  generation_params: any;
  created_at: Date;
  updated_at: Date;
}

export async function getGenerationQuota(userId: string) {
  try {
    const { data, error } = await supabase
      .from('generation_quotas')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // If no quota exists, create one
      return createGenerationQuota(userId);
    }

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[DB] Error getting generation quota:', err);
    throw err;
  }
}

export async function createGenerationQuota(userId: string) {
  console.log(`[DB] Creating generation quota for user: ${userId}`);
  
  try {
    const { data, error } = await supabase
      .from('generation_quotas')
      .insert([{
        user_id: userId,
        generations_today: 0,
        total_generations: 0,
        last_generation_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[DB] Error creating generation quota:', err);
    throw err;
  }
}

export async function updateGenerationQuota(userId: string, generationsToday: number, totalGenerations: number) {
  try {
    const { data, error } = await supabase
      .from('generation_quotas')
      .upsert({
        user_id: userId,
        generations_today: generationsToday,
        total_generations: totalGenerations,
        last_generation_date: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[DB] Error updating generation quota:', err);
    throw err;
  }
}

export async function createGenerationRecord(
  userId: string,
  prompt: string,
  imageUrl: string,
  modelVersion: string,
  params: any
) {
  try {
    const { data, error } = await supabase
      .from('generation_records')
      .insert([{
        user_id: userId,
        prompt,
        image_url: imageUrl,
        status: 'completed',
        model_version: modelVersion,
        generation_params: params
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[DB] Error creating generation record:', err);
    throw err;
  }
}

export async function getGenerationRecords(
  userId: string, 
  limit = 5
): Promise<GenerationRecord[]> {
  console.log(`[DB] Getting generation records for user: ${userId}, limit: ${limit}`);
  const startTime = Date.now();

  try {
    const result = await DatabasePool.query(
      'SELECT * FROM generation_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );

    const duration = Date.now() - startTime;
    console.log(`[DB] Got ${result.rows.length} records in ${duration}ms`);

    return result.rows;
  } catch (err) {
    console.error('[DB] Error getting generation records:', err);
    throw err;
  }
}

// Make sure to export these properly
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`[DB] Attempt ${i + 1}/${retries} failed:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 5000)));
      }
    }
  }
  throw lastError;
};

export async function updateUserStats(
  userId: string,
  updates: { incrementUsed?: number }
) {
  const startTime = Date.now();
  console.log('[DB] Updating user stats for:', userId);

  try {
    const result = await DatabasePool.query(
      `
      UPDATE user_stats 
      SET 
        used = used + $2,
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
      `,
      [userId, updates.incrementUsed || 0]
    );

    const duration = Date.now() - startTime;
    console.log(`[DB] Updated user stats in ${duration}ms`);

    return result.rows[0];
  } catch (err) {
    console.error('[DB] Error updating user stats:', err);
    throw err;
  }
}