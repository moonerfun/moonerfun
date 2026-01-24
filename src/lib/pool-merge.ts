import { Pool, Launchpad } from '@/components/Explore/types';
import type { DatabasePool } from '@/hooks/useDatabasePools';

/**
 * Convert a database pool to the Pool format used by the Explore component
 * This allows us to display older tokens (>24h) that aren't in Jupiter's recent data
 */
export function databasePoolToExplorePool(dbPool: DatabasePool): Pool {
  return {
    id: dbPool.pool_address,
    chain: 'solana',
    dex: dbPool.is_migrated ? 'Meteora DAMM' : 'Meteora DBC',
    type: dbPool.is_migrated ? 'cpamm' : 'bonding-curve',
    createdAt: dbPool.created_at,
    bondingCurve: dbPool.is_migrated ? 100 : undefined, // 100% = graduated
    volume24h: dbPool.volume_24h || undefined,
    isUnreliable: false,
    updatedAt: dbPool.updated_at,
    baseAsset: {
      id: dbPool.base_mint,
      name: dbPool.name || 'Unknown',
      symbol: dbPool.symbol || '???',
      icon: dbPool.icon || undefined,
      decimals: 9, // Default for most SPL tokens
      tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      launchpad: 'met-dbc' as Launchpad, // mooner.fun uses Meteora DBC
      graduatedAt: dbPool.is_migrated ? dbPool.updated_at : undefined,
      graduatedPool: dbPool.damm_pool_address || undefined,
      fdv: dbPool.current_marketcap_usd || undefined,
      mcap: dbPool.current_marketcap_usd || undefined,
      usdPrice: dbPool.current_price_usd || undefined,
      liquidity: dbPool.liquidity || undefined,
      holderCount: dbPool.holder_count || undefined,
      twitter: dbPool.twitter || undefined,
      telegram: dbPool.telegram || undefined,
      website: dbPool.website || undefined,
      organicScoreLabel: 'medium' as const,
    },
  };
}

/**
 * Merge Jupiter API pools with database pools
 * This ensures we show all mooner.fun tokens even if they're older than 24h
 * 
 * @param jupiterPools - Pools from Jupiter API (recent activity)
 * @param dbPools - Pools from database (all historical)
 * @returns Merged array with Jupiter pools first, then DB-only pools
 */
export function mergePoolsWithDatabase(
  jupiterPools: Pool[],
  dbPools: DatabasePool[]
): Pool[] {
  // Create a set of pool IDs already in Jupiter results (by base mint)
  const jupiterMints = new Set(jupiterPools.map((p) => p.baseAsset.id));

  // Find database pools not in Jupiter results
  const missingPools = dbPools
    .filter((dbPool) => !jupiterMints.has(dbPool.base_mint))
    .map(databasePoolToExplorePool);

  // Return Jupiter pools first (they have more complete data), then DB-only pools
  return [...jupiterPools, ...missingPools];
}

/**
 * Filter pools to only include mooner.fun tokens
 * Uses base_mint to match against database
 */
export function filterMoonerPools(
  pools: Pool[],
  moonerMints: Set<string>
): Pool[] {
  return pools.filter((pool) => moonerMints.has(pool.baseAsset.id));
}
