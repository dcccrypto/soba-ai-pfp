import { supabase } from '@/lib/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    // First check if the connection is alive
    const { error: healthError } = await supabase.from('generation_quotas').select('count', { count: 'exact', head: true });
    if (healthError) {
      console.error('[API] Database health check failed:', healthError);
      return NextResponse.json(
        { error: 'Database connection failed', details: healthError.message },
        { status: 503 }
      );
    }

    // Then perform the actual query
    const { data, error } = await supabase
      .from('generation_quotas')
      .select('generations_today, total_generations, last_generation_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[API] Database query failed:', error);
      return NextResponse.json(
        { error: 'Database operation failed', details: error.message },
        { status: 500 }
      );
    }
    
    // If no data exists, return default values
    if (!data) {
      return NextResponse.json({
        quota: 10, // Default daily quota
        used: 0,
        total_generations: 0,
        last_generation_date: null
      });
    }

    // Transform the data to match the expected format
    return NextResponse.json({
      quota: 10, // Default daily quota
      used: data.generations_today || 0,
      total_generations: data.total_generations || 0,
      last_generation_date: data.last_generation_date
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 