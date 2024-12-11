import { Connection } from '@solana/web3.js';

export const getSolanaProvider = () => {
  return new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/4hNmNbgU4S5nb-f6Aq7vo2TF5MC-0lTb');
};

export const getBlockProduction = async () => {
  const connection = getSolanaProvider();
  try {
    const blockProduction = await connection.getBlockProduction();
    console.log('Latest Solana block production:', blockProduction);
    
    // Format the response for easier consumption
    return {
      byIdentity: blockProduction.byIdentity,
      range: blockProduction.range,
      total: {
        numBlocks: blockProduction.total.numBlocks,
        numSlots: blockProduction.total.numSlots
      }
    };
  } catch (error) {
    console.error('Failed to fetch block production:', error);
    throw error;
  }
};

// Optional: Add a method to get recent block
export const getRecentBlock = async () => {
  const connection = getSolanaProvider();
  try {
    const slot = await connection.getSlot();
    const block = await connection.getBlock(slot);
    console.log('Recent Solana block:', block);
    return block;
  } catch (error) {
    console.error('Failed to fetch recent block:', error);
    throw error;
  }
}; 