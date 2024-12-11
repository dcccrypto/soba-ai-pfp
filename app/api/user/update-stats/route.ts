import { NextResponse } from 'next/server';
import { updateUserStats } from '@/lib/server/postgres';
import { withRetry } from '@/lib/utils/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, incrementUsed } = body;

    console.log('[API] Updating stats for user:', userId, 'increment:', incrementUsed);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate incrementUsed
    if (typeof incrementUsed !== 'number' || incrementUsed <= 0) {
      return NextResponse.json(
        { error: 'Invalid increment value' },
        { status: 400 }
      );
    }

    // Use withRetry for database operations
    const result = await withRetry(async () => {
      return await updateUserStats(userId, { incrementUsed });
    });
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update user stats' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      stats: result 
    });
  } catch (error) {
    console.error('[API] Error updating user stats:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('database')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again.' },
          { status: 503 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 