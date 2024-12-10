import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres.qaawxqbinuvkedwsplvy:hEdHEoHYZkbhyPd2@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Helper functions for common operations
export async function getGenerationQuota(userId: string) {
  const result = await query(
    'SELECT * FROM generation_quotas WHERE user_id = $1',
    [userId]
  );
  return result.rows[0];
}

export async function createGenerationQuota(userId: string) {
  const result = await query(
    `INSERT INTO generation_quotas 
     (user_id, generations_today, total_generations, last_generation_date)
     VALUES ($1, 0, 0, NOW())
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

export async function updateGenerationQuota(userId: string, generationsToday: number, totalGenerations: number) {
  const result = await query(
    `UPDATE generation_quotas 
     SET generations_today = $2,
         total_generations = $3,
         last_generation_date = NOW(),
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId, generationsToday, totalGenerations]
  );
  return result.rows[0];
}

export async function getGenerationRecords(userId: string, limit = 5) {
  const result = await query(
    'SELECT * FROM generation_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
  return result.rows;
}

export async function createGenerationRecord(
  userId: string,
  prompt: string,
  imageUrl: string,
  modelVersion: string,
  params: any
) {
  const result = await query(
    `INSERT INTO generation_records 
     (user_id, prompt, image_url, status, model_version, generation_params)
     VALUES ($1, $2, $3, 'completed', $4, $5)
     RETURNING *`,
    [userId, prompt, imageUrl, modelVersion, params]
  );
  return result.rows[0];
} 