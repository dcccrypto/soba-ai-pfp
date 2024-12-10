import { NextResponse } from 'next/server';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

const SOBA_TOKEN_ADDRESS = new PublicKey('25p2BoNp6qrJH5As6ek6H7Ei495oSkyZd3tGb97sqFmH');
const MINIMUM_TOKENS_REQUIRED = 10;
const SOBA_DECIMALS = 6;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log('[NFT Verify] Starting verification process');

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      console.log('[NFT Verify] Missing userId parameter');
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    console.log(`[NFT Verify] Checking SOBA balance for: ${userId}`);
    console.log(`[NFT Verify] Using RPC URL: ${RPC_URL}`);
    console.log(`[NFT Verify] SOBA token address: ${SOBA_TOKEN_ADDRESS.toString()}`);
    
    const connection = new Connection(RPC_URL, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });

    const userPubkey = new PublicKey(userId);

    // Get the associated token account address
    const associatedTokenAddress = await getAssociatedTokenAddress(
      SOBA_TOKEN_ADDRESS,  // mint
      userPubkey          // owner
    );

    console.log(`[NFT Verify] Associated token address: ${associatedTokenAddress.toString()}`);

    let totalBalance = 0;

    try {
      // Get the token account info
      const tokenAccount = await getAccount(connection, associatedTokenAddress);
      console.log('[NFT Verify] Token account found:', {
        mint: tokenAccount.mint.toString(),
        owner: tokenAccount.owner.toString(),
        amount: tokenAccount.amount.toString()
      });

      // Calculate balance (SOBA has 6 decimals)
      totalBalance = Number(tokenAccount.amount) / Math.pow(10, SOBA_DECIMALS);
      console.log('[NFT Verify] Raw amount:', tokenAccount.amount.toString());
      console.log('[NFT Verify] Calculated balance:', totalBalance);

    } catch (err) {
      console.log('[NFT Verify] No associated token account found, checking all token accounts...');
      
      // Fallback: check all token accounts
      const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
        userPubkey,
        {
          mint: SOBA_TOKEN_ADDRESS
        }
      );

      console.log(`[NFT Verify] Found ${allTokenAccounts.value.length} SOBA token accounts`);

      // Sum up balances from all accounts
      for (const account of allTokenAccounts.value) {
        const tokenAmount = account.account.data.parsed.info.tokenAmount;
        console.log('[NFT Verify] Token account:', {
          address: account.pubkey.toString(),
          amount: tokenAmount.amount,
          decimals: tokenAmount.decimals,
          uiAmount: tokenAmount.uiAmount
        });

        // Use raw amount for precise calculation
        const rawAmount = BigInt(tokenAmount.amount);
        const uiAmount = Number(rawAmount) / Math.pow(10, SOBA_DECIMALS);
        console.log('[NFT Verify] Account calculation:', {
          rawAmount: rawAmount.toString(),
          uiAmount
        });
        totalBalance += uiAmount;
      }
    }

    console.log(`[NFT Verify] Total SOBA balance: ${totalBalance}`);

    const response = { 
      hasNft: totalBalance >= MINIMUM_TOKENS_REQUIRED,
      balance: totalBalance,
      minimumRequired: MINIMUM_TOKENS_REQUIRED
    };

    const duration = Date.now() - startTime;
    console.log(`[NFT Verify] Verification completed in ${duration}ms:`, response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[NFT Verify] Token verification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify token balance',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 