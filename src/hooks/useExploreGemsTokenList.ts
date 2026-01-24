import { ApeQueries, GemsTokenListQueryArgs, QueryData } from '@/components/Explore/queries';
import { TokenListTimeframe } from '@/components/Explore/types';
import { useExplore } from '@/contexts/ExploreProvider';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { mergePoolsWithDatabase } from '@/lib/pool-merge';
import { DatabasePool } from '@/hooks/useDatabasePools';

type GemsTokenListData = QueryData<typeof ApeQueries.gemsTokenList>;

/**
 * Fetch all mooner.fun pools from the database
 * Used as a fallback for pools older than 24h that Jupiter API doesn't return
 */
async function fetchDatabasePools(): Promise<DatabasePool[]> {
  try {
    const response = await fetch('/api/pools?pageSize=100&status=all&sortBy=created_at&sortDir=desc');
    if (!response.ok) {
      console.warn('Failed to fetch database pools for backfill');
      return [];
    }
    const data = await response.json();
    return data.pools || [];
  } catch (error) {
    console.warn('Error fetching database pools:', error);
    return [];
  }
}

export function useExploreGemsTokenList<T = GemsTokenListData>(
  select?: (data: GemsTokenListData) => T
) {
  const { request } = useExplore();

  // Fetch from Jupiter API (recent 24h activity)
  const jupiterQuery = useQuery({
    ...ApeQueries.gemsTokenList(request),
    refetchInterval: 30 * 1000,
    // Ensure data is considered stale so it refetches properly
    staleTime: 10 * 1000,
    // Refetch when window regains focus to catch any missed updates
    refetchOnWindowFocus: true,
  });

  // Fetch from database for backfill (tokens older than 24h)
  const dbQuery = useQuery({
    queryKey: ['database-pools-backfill'],
    queryFn: fetchDatabasePools,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
  });

  // Merge Jupiter data with database backfill
  const mergedData = useMemo((): GemsTokenListData | undefined => {
    if (!jupiterQuery.data) {
      return undefined;
    }

    const dbPools = dbQuery.data || [];

    // If no database pools, just return Jupiter data
    if (dbPools.length === 0) {
      return jupiterQuery.data;
    }

    // Merge each category with database backfill
    return {
      ...jupiterQuery.data,
      recent: jupiterQuery.data.recent
        ? {
            pools: mergePoolsWithDatabase(
              jupiterQuery.data.recent.pools,
              // For "New" tab: include non-graduated pools from DB
              dbPools.filter((p) => !p.is_migrated)
            ),
          }
        : undefined,
      // "Graduating" tab doesn't need backfill - these are always recent
      aboutToGraduate: jupiterQuery.data.aboutToGraduate,
      graduated: jupiterQuery.data.graduated
        ? {
            pools: mergePoolsWithDatabase(
              jupiterQuery.data.graduated.pools,
              // For "Bonded" tab: include graduated/migrated pools from DB
              dbPools.filter((p) => p.is_migrated)
            ),
          }
        : undefined,
      args: jupiterQuery.data.args,
    };
  }, [jupiterQuery.data, dbQuery.data]);

  // Apply the select function if provided
  const selectedData = useMemo(() => {
    if (!mergedData) return undefined;
    return select ? select(mergedData) : (mergedData as unknown as T);
  }, [mergedData, select]);

  return {
    ...jupiterQuery,
    data: selectedData,
    // Indicate if either query is fetching
    isFetching: jupiterQuery.isFetching || dbQuery.isFetching,
  };
}
