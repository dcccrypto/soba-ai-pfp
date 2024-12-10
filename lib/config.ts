export const config = {
  app: {
    name: 'Soba AI PFP',
    description: 'AI-Powered NFT Profile Picture Platform on Solana',
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  solana: {
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
    rpcHost: process.env.NEXT_PUBLIC_RPC_HOST || 'https://api.devnet.solana.com',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  ai: {
    replicateApiToken: process.env.REPLICATE_API_TOKEN!,
    modelVersion: 'stability-ai/sdxl:2b017d9b67edd2ee1401238df49d75da53c523f36e363881e057f5dc3ed3c5b2',
    allowedDomains: ['replicate.delivery']
  },
} as const;

export type Config = typeof config; 