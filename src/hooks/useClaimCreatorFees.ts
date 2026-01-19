import { useCallback, useState, useMemo } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { 
  Connection, 
  PublicKey, 
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import BN from 'bn.js';

// Custom fetch that proxies RPC requests through our API to hide the API key
const proxyFetch: typeof fetch = async (input, init) => {
  if (typeof window !== 'undefined' && init?.method === 'POST') {
    return fetch('/api/rpc', init);
  }
  return fetch(input, init);
};

// Use public RPC URL (actual requests go through proxy)
const RPC_ENDPOINT = 'https://api.devnet.solana.com';

// Create connection with proxy fetch
const createProxiedConnection = () => new Connection(RPC_ENDPOINT, {
  commitment: 'confirmed',
  fetch: proxyFetch,
});

export type ClaimResult = {
  success: boolean;
  txSignature?: string;
  error?: string;
  quoteAmount?: number;
  baseAmount?: number;
};

export type CreatorFeeInfo = {
  poolAddress: string;
  baseMint: string;
  creatorQuoteFee: BN;
  creatorBaseFee: BN;
  hasClaimableFees: boolean;
  isCreator: boolean;
};

export function useClaimCreatorFees() {
  const { publicKey, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [claimingPool, setClaimingPool] = useState<string | null>(null);

  // Create connection once, memoized
  const connection = useMemo(() => createProxiedConnection(), []);
  const client = useMemo(() => new DynamicBondingCurveClient(connection, 'confirmed'), [connection]);

  /**
   * Get claimable creator fees for a token by its base mint
   * This looks up the DBC pool (not the DAMM pool) to check fees
   */
  const getCreatorFeeInfo = useCallback(async (
    baseMint: string
  ): Promise<CreatorFeeInfo | null> => {
    if (!publicKey) return null;

    try {
      const baseMintPubkey = new PublicKey(baseMint);
      
      // Look up the DBC pool by base mint
      const pool = await client.state.getPoolByBaseMint(baseMintPubkey);
      if (!pool) {
        return null;
      }

      const poolAddress = pool.publicKey.toString();
      const isCreator = pool.account.creator.toString() === publicKey.toString();

      // Get fee metrics from the DBC pool
      const feeMetrics = await client.state.getPoolFeeMetrics(pool.publicKey);
      if (!feeMetrics) {
        return {
          poolAddress,
          baseMint,
          creatorQuoteFee: new BN(0),
          creatorBaseFee: new BN(0),
          hasClaimableFees: false,
          isCreator,
        };
      }

      const creatorQuoteFee = feeMetrics.current.creatorQuoteFee;
      const creatorBaseFee = feeMetrics.current.creatorBaseFee;
      const hasClaimableFees = !creatorQuoteFee.isZero() || !creatorBaseFee.isZero();

      return {
        poolAddress,
        baseMint,
        creatorQuoteFee,
        creatorBaseFee,
        hasClaimableFees,
        isCreator,
      };
    } catch (error) {
      console.error('Failed to get creator fee info:', error);
      return null;
    }
  }, [publicKey, client]);

  /**
   * Claim creator trading fees from the DBC pool
   * @param baseMint - The base mint of the token (NOT the DAMM pool address)
   */
  const claimFees = useCallback(async (
    baseMint: string
  ): Promise<ClaimResult> => {
    if (!publicKey || !signTransaction) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setClaimingPool(baseMint);

    try {
      const baseMintPubkey = new PublicKey(baseMint);
      
      // Look up the DBC pool by base mint (even for migrated tokens, DBC pool still exists)
      const pool = await client.state.getPoolByBaseMint(baseMintPubkey);
      if (!pool) {
        return { success: false, error: 'DBC pool not found for this token' };
      }

      const poolPubkey = pool.publicKey;

      // Verify the connected wallet is the creator
      const isCreator = pool.account.creator.toString() === publicKey.toString();
      if (!isCreator) {
        return { success: false, error: 'You are not the creator of this pool' };
      }

      // Get fee metrics
      const feeMetrics = await client.state.getPoolFeeMetrics(poolPubkey);
      if (!feeMetrics) {
        return { success: false, error: 'Could not fetch fee metrics' };
      }

      const creatorQuoteFee = feeMetrics.current.creatorQuoteFee;
      const creatorBaseFee = feeMetrics.current.creatorBaseFee;

      // Check if there are fees to claim
      if (creatorQuoteFee.isZero() && creatorBaseFee.isZero()) {
        return { success: true, quoteAmount: 0, baseAmount: 0, error: 'No fees to claim' };
      }

      // Build claim transaction
      const claimTx = await client.creator.claimCreatorTradingFee({
        creator: publicKey,
        pool: poolPubkey,
        maxBaseAmount: creatorBaseFee,
        maxQuoteAmount: creatorQuoteFee,
        payer: publicKey,
      });

      // Get recent blockhash with 'finalized' commitment for more stability
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      
      // Add priority fee instructions for faster confirmation
      const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100_000, // 0.0001 SOL per CU - adjust as needed
      });
      const computeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      });

      // Get instructions from the legacy transaction
      const instructions = [
        priorityFeeIx,
        computeUnitsIx,
        ...claimTx.instructions,
      ];

      // Build versioned transaction for better compatibility
      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const versionedTx = new VersionedTransaction(messageV0);

      // Sign transaction
      const signedTx = await signTransaction(versionedTx);

      // Send with skipPreflight for speed, then confirm
      const txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      console.log('Claim transaction sent:', txSignature);

      // Confirm with timeout and retry logic
      const confirmResult = await connection.confirmTransaction(
        {
          signature: txSignature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmResult.value.err) {
        return {
          success: false,
          error: `Transaction failed: ${JSON.stringify(confirmResult.value.err)}`,
        };
      }

      console.log('Claim transaction confirmed:', txSignature);

      return {
        success: true,
        txSignature,
        quoteAmount: creatorQuoteFee.toNumber() / 1e9,
        baseAmount: creatorBaseFee.toNumber() / 1e6,
      };
    } catch (error) {
      console.error('Failed to claim creator fees:', error);
      
      // Better error messages
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim fees';
      if (errorMessage.includes('block height exceeded') || errorMessage.includes('expired')) {
        return {
          success: false,
          error: 'Transaction expired. Network may be congested - please try again.',
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
      setClaimingPool(null);
    }
  }, [publicKey, signTransaction, connection, client]);

  return {
    claimFees,
    getCreatorFeeInfo,
    isLoading,
    claimingPool,
  };
}

export default useClaimCreatorFees;
