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
    modelVersion: 'dcccrypto/soba:e0e293b97de2af9d7ad1851c13b14e01036fa7040b6dd39eec05d18f76dcc997',
    allowedDomains: ['replicate.delivery']
  },
} as const;

export type Config = typeof config; 