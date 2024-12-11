import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Missing Supabase URL or anonymous key');
}

console.log('[Supabase] Initializing client with URL:', config.supabase.url.replace(/:[^:@]+@/, ':***@'));

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: { 
        'x-application-name': 'soba-ai-pfp',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    }
  }
);

// Add connection health check with retry
export const checkSupabaseConnection = async (retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { error } = await supabase
        .from('generation_quotas')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error(`[Supabase] Health check attempt ${i + 1} failed:`, error);
        if (i === retries - 1) return false;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        continue;
      }
      return true;
    } catch (err) {
      console.error(`[Supabase] Health check attempt ${i + 1} error:`, err);
      if (i === retries - 1) return false;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
};

// Add retry mechanism for database operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`[Supabase] Operation attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('All retry attempts failed');
};

// Initialize connection check
checkSupabaseConnection().then(isConnected => {
  if (!isConnected) {
    console.error('[Supabase] Failed to establish initial connection');
  } else {
    console.log('[Supabase] Initial connection successful');
  }
}); 