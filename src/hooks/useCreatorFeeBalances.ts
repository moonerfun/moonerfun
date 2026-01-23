import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Connection, PublicKey } from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import BN from 'bn.js';

// Custom fetch that proxies RPC requests through our API to hide the API key
// All RPC calls go to /api/rpc which forwards to the server's RPC_URL (mainnet)
const proxyFetch: typeof fetch = async (input, init) => {
  if (typeof window !== 'undefined' && init?.method === 'POST') {
    return fetch('/api/rpc', init);
  }
  return fetch(input, init);
};

// This URL is just a placeholder - actual requests go through the proxy to the configured RPC_URL
// The proxy at /api/rpc forwards all requests to process.env.RPC_URL (mainnet)
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

// Create connection with proxy fetch
const createProxiedConnection = () => new Connection(RPC_ENDPOINT, {
  commitment: 'confirmed',
  fetch: proxyFetch,
});

export type ClaimableFeeInfo = {
  baseMint: string;
  dbcPoolAddress: string;
  creatorQuoteFee: BN;
  creatorBaseFee: BN;
  creatorQuoteFeeUsd: number; // Quote is SOL, so we can estimate USD
  creatorBaseFeeTokens: number; // Base token amount
  hasClaimableFees: boolean;
  isCreator: boolean;
  isMigrated: boolean;
};

/**
 * Fetch claimable creator fees from the DBC pool for a single token
 */
async function fetchCreatorFeeBalance(
  client: DynamicBondingCurveClient,
  baseMint: string,
  walletAddress: string,
  solPrice: number = 200 // Default SOL price, could be fetched dynamically
): Promise<ClaimableFeeInfo | null> {
  try {
    const baseMintPubkey = new PublicKey(baseMint);
    
    // Look up the DBC pool by base mint
    const pool = await client.state.getPoolByBaseMint(baseMintPubkey);
    if (!pool) {
      return null;
    }

    const dbcPoolAddress = pool.publicKey.toString();
    const isCreator = pool.account.creator.toString() === walletAddress;
    const isMigrated = Boolean(pool.account.isMigrated);

    // Get fee metrics from the DBC pool
    const feeMetrics = await client.state.getPoolFeeMetrics(pool.publicKey);
    if (!feeMetrics) {
      return {
        baseMint,
        dbcPoolAddress,
        creatorQuoteFee: new BN(0),
        creatorBaseFee: new BN(0),
        creatorQuoteFeeUsd: 0,
        creatorBaseFeeTokens: 0,
        hasClaimableFees: false,
        isCreator,
        isMigrated,
      };
    }

    const creatorQuoteFee = feeMetrics.current.creatorQuoteFee;
    const creatorBaseFee = feeMetrics.current.creatorBaseFee;
    const hasClaimableFees = !creatorQuoteFee.isZero() || !creatorBaseFee.isZero();

    // Convert to human-readable amounts
    // Quote is SOL (9 decimals), Base is token (typically 6 decimals)
    const quoteFeeInSol = creatorQuoteFee.toNumber() / 1e9;
    const baseFeeTokens = creatorBaseFee.toNumber() / 1e6;
    const quoteFeeUsd = quoteFeeInSol * solPrice;

    return {
      baseMint,
      dbcPoolAddress,
      creatorQuoteFee,
      creatorBaseFee,
      creatorQuoteFeeUsd: quoteFeeUsd,
      creatorBaseFeeTokens: baseFeeTokens,
      hasClaimableFees,
      isCreator,
      isMigrated,
    };
  } catch (error) {
    console.error(`Failed to fetch creator fee balance for ${baseMint}:`, error);
    return null;
  }
}

/**
 * Hook to fetch claimable creator fees for multiple tokens
 */
export function useCreatorFeeBalances(baseMints: string[]) {
  const { publicKey } = useWallet();
  
  // Create connection and client once
  const connection = useMemo(() => createProxiedConnection(), []);
  const client = useMemo(() => new DynamicBondingCurveClient(connection, 'confirmed'), [connection]);

  const query = useQuery({
    queryKey: ['creatorFeeBalances', publicKey?.toString(), baseMints.join(',')],
    queryFn: async () => {
      if (!publicKey || baseMints.length === 0) {
        return {};
      }

      const walletAddress = publicKey.toString();
      const results: Record<string, ClaimableFeeInfo> = {};

      // Fetch fees for each token (sequential to avoid rate limits)
      for (const baseMint of baseMints) {
        const feeInfo = await fetchCreatorFeeBalance(client, baseMint, walletAddress);
        if (feeInfo) {
          results[baseMint] = feeInfo;
        }
      }

      return results;
    },
    enabled: !!publicKey && baseMints.length > 0,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
  });

  // Calculate totals
  const totals = useMemo(() => {
    if (!query.data) {
      return { totalQuoteFeeUsd: 0, totalClaimableCount: 0 };
    }

    let totalQuoteFeeUsd = 0;
    let totalClaimableCount = 0;

    Object.values(query.data).forEach((info) => {
      if (info.hasClaimableFees && info.isCreator) {
        totalQuoteFeeUsd += info.creatorQuoteFeeUsd;
        totalClaimableCount += 1;
      }
    });

    return { totalQuoteFeeUsd, totalClaimableCount };
  }, [query.data]);

  return {
    feeBalances: query.data ?? {},
    totals,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export default useCreatorFeeBalances;
