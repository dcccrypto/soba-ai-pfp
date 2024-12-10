import { NextRequest, NextResponse } from 'next/server';
import { getGenerationQuota, createGenerationQuota } from '@/lib/server/postgres';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    console.log('Initializing user:', userId);

    try {
      // Check if user already has a quota
      const existingQuota = await getGenerationQuota(userId);
      console.log('Existing quota:', existingQuota);

      if (existingQuota) {
        return NextResponse.json(existingQuota);
      }

      // Create new quota for user
      const newQuota = await createGenerationQuota(userId);
      console.log('Created new quota:', newQuota);
      return NextResponse.json(newQuota);

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in user init:', error);
    return NextResponse.json({ 
      error: 'Invalid request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 400 });
  }
} 