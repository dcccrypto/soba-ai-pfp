'use client';

import { useState } from 'react';
import { supabase } from '@/lib/utils/supabase';

export default function DbTestPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = '4mazbd8ShWdoxq1fgL2EyXTyfTQW9CuZiQjv3aBn2eCC'; // Your wallet address

  const testInsertGeneration = async () => {
    try {
      const testData = {
        user_id: userId,
        prompt: 'Test prompt ' + Date.now(),
        image_url: 'https://replicate.delivery/test/image.jpg',
        status: 'completed',
        model_version: 'test-version',
        generation_params: { test: true }
      };

      console.log('Inserting test data:', testData);

      const { data, error: dbError, status } = await supabase
        .from('generation_records')
        .insert([testData])
        .select()
        .single();

      console.log('Insert response:', { data, error: dbError, status });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }
      
      setResult(data);
      setError(null);
    } catch (err) {
      console.error('Insert error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult(null);
    }
  };

  const testFetchGenerations = async () => {
    try {
      console.log('Fetching generations for user:', userId);

      const { data, error: dbError, status } = await supabase
        .from('generation_records')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      console.log('Fetch response:', { data, error: dbError, status });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      setResult(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult(null);
    }
  };

  const testQuota = async () => {
    try {
      const testData = {
        user_id: userId,
        generations_today: 1,
        total_generations: 1
      };

      console.log('Updating quota:', testData);

      const { data, error: dbError, status } = await supabase
        .from('generation_quotas')
        .upsert([testData])
        .select()
        .single();

      console.log('Quota response:', { data, error: dbError, status });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      setResult(data);
      setError(null);
    } catch (err) {
      console.error('Quota error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Database Test Page</h1>
      
      <div className="mb-4 text-gray-600">
        Testing with User ID: {userId}
      </div>
      
      <div className="space-x-4 mb-8">
        <button
          onClick={testInsertGeneration}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Insert Generation
        </button>
        
        <button
          onClick={testFetchGenerations}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Fetch Generations
        </button>

        <button
          onClick={testQuota}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Test Quota
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 