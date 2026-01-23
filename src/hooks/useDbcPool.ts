import { useState, useCallback, useEffect } from 'react';
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

export interface DbcPoolState {
  poolAddress: PublicKey;
  configAddress: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseReserve: BN;
  quoteReserve: BN;
  baseDecimals: number;
  quoteDecimals: number;
  migrationQuoteThreshold: BN;
  isGraduated: boolean;
  activationType: number;
  creatorTradingFeePercentage: number;
}

export interface UseDbcPoolResult {
  poolState: DbcPoolState | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getSwapQuote: (params: SwapQuoteParams) => Promise<SwapQuoteResult | null>;
  buildSwapTransaction: (params: BuildSwapParams) => Promise<any>;
}

export interface SwapQuoteParams {
  amountIn: BN;
  swapBaseForQuote: boolean;
}

export interface SwapQuoteResult {
  amountOut: BN;
  minimumAmountOut: BN;
  fee: BN;
}

export interface BuildSwapParams {
  amountIn: BN;
  minimumAmountOut: BN;
  swapBaseForQuote: boolean;
  owner: PublicKey;
}

/**
 * Hook to interact with a DBC pool
 */
export function useDbcPool(baseMintAddress: string | undefined): UseDbcPoolResult {
  const [connection] = useState(() => createProxiedConnection());
  const [dbcClient] = useState(() => new DynamicBondingCurveClient(connection, 'confirmed'));
  
  const [poolState, setPoolState] = useState<DbcPoolState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolState = useCallback(async () => {
    if (!baseMintAddress) {
      setPoolState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseMint = new PublicKey(baseMintAddress);
      const pool = await dbcClient.state.getPoolByBaseMint(baseMint);
      
      if (!pool) {
        setError('DBC pool not found');
        setPoolState(null);
        return;
      }

      const config = await dbcClient.state.getPoolConfig(pool.account.config);
      if (!config) {
        setError('Pool config not found');
        setPoolState(null);
        return;
      }

      // Get token decimals
      const quoteMintInfo = await connection.getParsedAccountInfo(config.quoteMint);
      const quoteDecimals = (quoteMintInfo.value?.data as any)?.parsed?.info?.decimals ?? 9;
      
      const baseMintInfo = await connection.getParsedAccountInfo(baseMint);
      const baseDecimals = (baseMintInfo.value?.data as any)?.parsed?.info?.decimals ?? 6;

      setPoolState({
        poolAddress: pool.publicKey,
        configAddress: pool.account.config,
        baseMint,
        quoteMint: config.quoteMint,
        baseReserve: pool.account.baseReserve,
        quoteReserve: pool.account.quoteReserve,
        baseDecimals,
        quoteDecimals,
        migrationQuoteThreshold: config.migrationQuoteThreshold,
        isGraduated: Boolean(pool.account.isMigrated),
        activationType: config.activationType,
        creatorTradingFeePercentage: config.creatorTradingFeePercentage,
      });
    } catch (err: any) {
      console.error('Error fetching DBC pool:', err);
      setError(err.message || 'Failed to fetch pool');
      setPoolState(null);
    } finally {
      setIsLoading(false);
    }
  }, [baseMintAddress, dbcClient, connection]);

  const getSwapQuote = useCallback(async (params: SwapQuoteParams): Promise<SwapQuoteResult | null> => {
    if (!poolState) return null;

    try {
      const pool = await dbcClient.state.getPoolByBaseMint(poolState.baseMint);
      if (!pool) return null;

      const config = await dbcClient.state.getPoolConfig(poolState.configAddress);
      if (!config) return null;

      // Get current point
      let currentPoint: number;
      if (config.activationType === 0) {
        currentPoint = await connection.getSlot();
      } else {
        const slot = await connection.getSlot();
        const blockTime = await connection.getBlockTime(slot);
        currentPoint = blockTime || Math.floor(Date.now() / 1000);
      }

      const quote = await dbcClient.pool.swapQuote({
        virtualPool: pool.account,
        config,
        swapBaseForQuote: params.swapBaseForQuote,
        amountIn: params.amountIn,
        hasReferral: false,
        currentPoint: new BN(currentPoint),
      });

      return {
        amountOut: quote.outputAmount,
        minimumAmountOut: quote.minimumAmountOut,
        fee: quote.tradingFee,
      };
    } catch (err) {
      console.error('Error getting swap quote:', err);
      return null;
    }
  }, [poolState, dbcClient, connection]);

  const buildSwapTransaction = useCallback(async (params: BuildSwapParams) => {
    if (!poolState) throw new Error('Pool not loaded');

    const swapTx = await dbcClient.pool.swap({
      amountIn: params.amountIn,
      minimumAmountOut: params.minimumAmountOut,
      owner: params.owner,
      pool: poolState.poolAddress,
      swapBaseForQuote: params.swapBaseForQuote,
      referralTokenAccount: null,
    });

    return swapTx;
  }, [poolState, dbcClient]);

  useEffect(() => {
    fetchPoolState();
  }, [fetchPoolState]);

  return {
    poolState,
    isLoading,
    error,
    refetch: fetchPoolState,
    getSwapQuote,
    buildSwapTransaction,
  };
}

/**
 * Check if a token is on DBC or graduated to DAMM
 */
export async function checkTokenStatus(baseMintAddress: string): Promise<{
  onDbc: boolean;
  onDamm: boolean;
  poolAddress?: string;
}> {
  const connection = createProxiedConnection();
  const dbcClient = new DynamicBondingCurveClient(connection, 'confirmed');
  
  try {
    const baseMint = new PublicKey(baseMintAddress);
    const pool = await dbcClient.state.getPoolByBaseMint(baseMint);
    
    if (pool) {
      return {
        onDbc: !pool.account.isMigrated,
        onDamm: Boolean(pool.account.isMigrated),
        poolAddress: pool.publicKey.toString(),
      };
    }
    
    return { onDbc: false, onDamm: false };
  } catch {
    return { onDbc: false, onDamm: false };
  }
}
