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

// Add connection health check
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('generation_quotas')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('[Supabase] Health check failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Health check error:', err);
    return false;
  }
};

// Initialize connection check
checkSupabaseConnection().then(isConnected => {
  if (!isConnected) {
    console.error('[Supabase] Failed to establish initial connection');
  } else {
    console.log('[Supabase] Initial connection successful');
  }
}); 