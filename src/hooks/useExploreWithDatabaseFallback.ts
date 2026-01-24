import { useQuery } from '@tanstack/react-query';
import { ApeQueries, GemsTokenListQueryArgs, QueryData } from '@/components/Explore/queries';
import { useExplore } from '@/contexts/ExploreProvider';
import { useDatabasePools, DatabasePool } from '@/hooks/useDatabasePools';
import { mergePoolsWithDatabase } from '@/lib/pool-merge';
import { useMemo } from 'react';
import { ExploreTab, Pool } from '@/components/Explore/types';

type GemsTokenListData = QueryData<typeof ApeQueries.gemsTokenList>;

/**
 * Enhanced hook that combines Jupiter API with database fallback
 * This ensures older tokens (>24h) are still displayed in the explore view
 */
export function useExploreWithDatabaseFallback<T = GemsTokenListData>(
  select?: (data: GemsTokenListData) => T
) {
  const { request } = useExplore();

  // Fetch from Jupiter API (recent 24h activity)
  const jupiterQuery = useQuery({
    ...ApeQueries.gemsTokenList(request),
    refetchInterval: 30 * 1000,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch all historical pools from database
  const dbQuery = useDatabasePools({
    pageSize: 100,
    status: 'all',
    sortBy: 'created_at',
    sortDir: 'desc',
  });

  // Merge the data
  const mergedData = useMemo(() => {
    if (!jupiterQuery.data) {
      return undefined;
    }

    const dbPools = dbQuery.data?.pools || [];

    // Merge each category
    const merged: GemsTokenListData = {
      ...jupiterQuery.data,
      recent: jupiterQuery.data.recent
        ? {
            pools: mergePoolsWithDatabase(
              jupiterQuery.data.recent.pools,
              dbPools.filter((p) => !p.is_migrated) // Non-graduated for "New" tab
            ),
          }
        : undefined,
      aboutToGraduate: jupiterQuery.data.aboutToGraduate,
      graduated: jupiterQuery.data.graduated
        ? {
            pools: mergePoolsWithDatabase(
              jupiterQuery.data.graduated.pools,
              dbPools.filter((p) => p.is_migrated) // Graduated for "Bonded" tab
            ),
          }
        : undefined,
      args: jupiterQuery.data.args,
    };

    return merged;
  }, [jupiterQuery.data, dbQuery.data]);

  // Apply select if provided
  const selectedData = useMemo(() => {
    if (!mergedData) return undefined;
    return select ? select(mergedData) : (mergedData as unknown as T);
  }, [mergedData, select]);

  return {
    data: selectedData,
    status: jupiterQuery.status,
    isLoading: jupiterQuery.isLoading,
    isFetching: jupiterQuery.isFetching || dbQuery.isFetching,
    error: jupiterQuery.error,
    // Expose individual query states for debugging
    jupiterStatus: jupiterQuery.status,
    dbStatus: dbQuery.status,
  };
}

/**
 * Hook to get database pools that are missing from Jupiter API
 * Useful for showing a "Historical Tokens" section
 */
export function useMissingDatabasePools() {
  const { request } = useExplore();

  // Get Jupiter pools
  const jupiterQuery = useQuery({
    ...ApeQueries.gemsTokenList(request),
    refetchInterval: 30 * 1000,
    staleTime: 10 * 1000,
  });

  // Get all database pools
  const dbQuery = useDatabasePools({
    pageSize: 100,
    status: 'all',
  });

  const missingPools = useMemo(() => {
    if (!dbQuery.data?.pools) return [];

    // Collect all mints from Jupiter API across all categories
    const jupiterMints = new Set<string>();

    if (jupiterQuery.data?.recent?.pools) {
      jupiterQuery.data.recent.pools.forEach((p) => jupiterMints.add(p.baseAsset.id));
    }
    if (jupiterQuery.data?.aboutToGraduate?.pools) {
      jupiterQuery.data.aboutToGraduate.pools.forEach((p) => jupiterMints.add(p.baseAsset.id));
    }
    if (jupiterQuery.data?.graduated?.pools) {
      jupiterQuery.data.graduated.pools.forEach((p) => jupiterMints.add(p.baseAsset.id));
    }

    // Return DB pools not in any Jupiter category
    return dbQuery.data.pools.filter((p) => !jupiterMints.has(p.base_mint));
  }, [jupiterQuery.data, dbQuery.data]);

  return {
    pools: missingPools,
    total: missingPools.length,
    isLoading: jupiterQuery.isLoading || dbQuery.isLoading,
  };
}
