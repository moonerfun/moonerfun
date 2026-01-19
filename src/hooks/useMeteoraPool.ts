import { useQuery } from '@tanstack/react-query';

const METEORA_DAMM_V2_API = 'https://dammv2-api.meteora.ag';
const JUPITER_DATAPI = 'https://datapi.jup.ag/v1';

// Jupiter DataAPI types
export type JupiterPoolAsset = {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  dev: string;
  circSupply: number;
  totalSupply: number;
  holderCount: number;
  fdv: number;
  mcap: number;
  usdPrice: number;
  liquidity: number;
  stats5m?: JupiterStats;
  stats1h?: JupiterStats;
  stats6h?: JupiterStats;
  stats24h?: JupiterStats;
};

export type JupiterStats = {
  priceChange: number;
  holderChange: number;
  liquidityChange: number;
  volumeChange: number;
  buyVolume: number;
  sellVolume: number;
  numBuys: number;
  numSells: number;
  numTraders: number;
  numNetBuyers: number;
};

export type JupiterPool = {
  id: string;
  chain: string;
  dex: string;
  type: string;
  quoteAsset: string;
  createdAt: string;
  liquidity: number;
  volume24h: number;
  updatedAt: string;
  baseAsset: JupiterPoolAsset;
};

export type JupiterPoolsResponse = {
  pools: JupiterPool[];
  total: number;
};

export type MeteoraPoolData = {
  pool_address: string;
  creator: string;
  pool_name: string;
  token_a_mint: string;
  token_a_symbol: string;
  token_a_amount: number;
  token_a_amount_usd: number;
  token_b_mint: string;
  token_b_symbol: string;
  token_b_amount: number;
  token_b_amount_usd: number;
  pool_price: number;
  tvl: number;
  volume24h: number;
  fee24h: number;
  apr: number;
  liquidity: string;
  created_at_slot: number;
  created_at_slot_timestamp: number;
};

export type MeteoraPoolMetrics = {
  pool_address: string;
  tvl: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  lp_fee24h: number;
  lp_fee7d: number;
  lp_fee30d: number;
  partner_fee24h: number;
  partner_fee7d: number;
  partner_fee30d: number;
  protocol_fee24h: number;
  protocol_fee7d: number;
  protocol_fee30d: number;
  apr: number;
  fee_tvl_ratio: number;
};

export type MeteoraPoolWithMetrics = MeteoraPoolData & {
  metrics: MeteoraPoolMetrics | null;
  jupiter: JupiterPool | null;
};

async function fetchMeteoraPool(poolAddress: string): Promise<MeteoraPoolData | null> {
  try {
    const response = await fetch(`${METEORA_DAMM_V2_API}/pools/${poolAddress}`);
    if (!response.ok) return null;
    
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error(`Failed to fetch Meteora pool ${poolAddress}:`, error);
    return null;
  }
}

async function fetchMeteoraPoolMetrics(poolAddress: string): Promise<MeteoraPoolMetrics | null> {
  try {
    const response = await fetch(`${METEORA_DAMM_V2_API}/pools/${poolAddress}/metrics`);
    if (!response.ok) return null;
    
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error(`Failed to fetch Meteora pool metrics ${poolAddress}:`, error);
    return null;
  }
}

async function fetchJupiterPoolByAsset(assetId: string): Promise<JupiterPool | null> {
  try {
    const response = await fetch(`${JUPITER_DATAPI}/pools?assetIds=${assetId}`);
    if (!response.ok) return null;
    
    const result: JupiterPoolsResponse = await response.json();
    // Return the first pool (there should be one for graduated tokens)
    return result.pools?.[0] || null;
  } catch (error) {
    console.error(`Failed to fetch Jupiter pool for asset ${assetId}:`, error);
    return null;
  }
}

export async function fetchMeteoraPoolWithMetrics(
  poolAddress: string,
  baseMint?: string
): Promise<MeteoraPoolWithMetrics | null> {
  const [poolData, metrics] = await Promise.all([
    fetchMeteoraPool(poolAddress),
    fetchMeteoraPoolMetrics(poolAddress),
  ]);

  if (!poolData) return null;

  // Fetch Jupiter data using baseMint if provided, otherwise use token_a_mint from pool data
  const assetId = baseMint || poolData.token_a_mint;
  const jupiter = assetId ? await fetchJupiterPoolByAsset(assetId) : null;

  return {
    ...poolData,
    metrics,
    jupiter,
  };
}

export function useMeteoraPool(poolAddress: string | null | undefined, baseMint?: string) {
  return useQuery({
    queryKey: ['meteoraPool', poolAddress, baseMint],
    queryFn: () => fetchMeteoraPoolWithMetrics(poolAddress!, baseMint),
    enabled: !!poolAddress,
    staleTime: 30_000, // 30 seconds
  });
}

type PoolWithMint = {
  poolAddress: string;
  baseMint: string;
};

export function useMeteoraPoolsData(pools: PoolWithMint[]) {
  return useQuery({
    queryKey: ['meteoraPoolsData', pools.map(p => p.poolAddress).sort().join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        pools.map(({ poolAddress, baseMint }) => 
          fetchMeteoraPoolWithMetrics(poolAddress, baseMint)
        )
      );
      
      // Create a map of pool address -> data
      const poolDataMap: Record<string, MeteoraPoolWithMetrics> = {};
      results.forEach((data, index) => {
        if (data) {
          poolDataMap[pools[index].poolAddress] = data;
        }
      });
      
      return poolDataMap;
    },
    enabled: pools.length > 0,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });
}

export default useMeteoraPool;
