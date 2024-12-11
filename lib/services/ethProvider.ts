import { JsonRpcProvider } from 'ethers';

export const getEthereumProvider = () => {
  return new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
};

export const getLatestBlock = async () => {
  const provider = getEthereumProvider();
  try {
    const block = await provider.getBlock('latest');
    console.log('Latest Ethereum block:', block);
    return block;
  } catch (error) {
    console.error('Failed to fetch latest block:', error);
    throw error;
  }
}; 