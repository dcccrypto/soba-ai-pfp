import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createGenerationRecord, updateGenerationQuota, getGenerationQuota } from '@/lib/server/postgres';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_DAILY_GENERATIONS = 5;

export async function POST(req: NextRequest) {
  try {
    console.log('Received generation request');
    const body = await req.json();
    console.log('Request body:', body);

    const { prompt, params, userId } = body as {
      prompt: string;
      params?: any;
      userId: string;
    };

    // Validate request
    if (!prompt || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check user quota
    const quota = await getGenerationQuota(userId);
    if (!quota) {
      return NextResponse.json(
        { error: 'User quota not found' },
        { status: 404 }
      );
    }

    if (quota.generations_today >= MAX_DAILY_GENERATIONS) {
      return NextResponse.json(
        { error: 'Daily generation limit reached' },
        { status: 429 }
      );
    }

    // Generate image using Replicate
    try {
      const output = await replicate.run(
        "stability-ai/sdxl:2b017d9b67edd2ee1401238df49d75da53c523f36e363881e057f5dc3ed3c5b2",
        {
          input: {
            prompt,
            ...params
          }
        }
      );

      // The output will be an array with the image URL
      const imageUrl = Array.isArray(output) ? output[0] : output;

      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      // Update user quota
      await updateGenerationQuota(
        userId,
        quota.generations_today + 1,
        quota.total_generations + 1
      );

      // Record the generation
      await createGenerationRecord(
        userId,
        prompt,
        imageUrl,
        "stability-ai/sdxl:2b017d9b67edd2ee1401238df49d75da53c523f36e363881e057f5dc3ed3c5b2",
        params || {}
      );

      return NextResponse.json({
        success: true,
        imageUrl,
      });
    } catch (error) {
      console.error('Replicate API error:', error);
      return NextResponse.json(
        { error: 'Image generation failed', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generation endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    console.log('Checking quota for user:', userId);

    if (!userId) {
      console.log('Missing userId parameter');
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get user's generation quota
    const quota = await getGenerationQuota(userId);
    if (!quota) {
      return NextResponse.json({
        generationsToday: 0,
        totalGenerations: 0,
        remainingToday: MAX_DAILY_GENERATIONS
      });
    }

    const response = {
      generationsToday: quota.generations_today,
      totalGenerations: quota.total_generations,
      remainingToday: Math.max(0, MAX_DAILY_GENERATIONS - quota.generations_today)
    };

    console.log('Quota response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Quota check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 