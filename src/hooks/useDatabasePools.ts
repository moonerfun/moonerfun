import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import ky from 'ky';

/**
 * Types for database pool response
 */
export type DatabasePool = {
  id: string;
  pool_address: string;
  damm_pool_address: string | null;
  base_mint: string;
  name: string | null;
  symbol: string | null;
  icon: string | null;
  is_migrated: boolean;
  status: string;
  total_fees_collected_sol: number;
  current_marketcap_usd: number | null;
  current_price_usd: number | null;
  volume_24h: number | null;
  liquidity: number | null;
  holder_count: number | null;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

export type DatabasePoolsResponse = {
  pools: DatabasePool[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type DatabasePoolsParams = {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'migrated' | 'all';
  sortBy?: 'created_at' | 'marketcap' | 'fees';
  sortDir?: 'asc' | 'desc';
  search?: string;
};

/**
 * Fetch all mooner.fun pools from the database
 * This is a fallback for pools older than 24h that Jupiter API doesn't return
 */
async function fetchDatabasePools(params: DatabasePoolsParams = {}): Promise<DatabasePoolsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.status) searchParams.set('status', params.status);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir);
  if (params.search) searchParams.set('search', params.search);

  return ky
    .get('/api/pools', { searchParams })
    .json<DatabasePoolsResponse>();
}

/**
 * Hook to fetch database pools with pagination
 */
export function useDatabasePools(params: DatabasePoolsParams = {}) {
  return useQuery({
    queryKey: ['database-pools', params],
    queryFn: () => fetchDatabasePools(params),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook for infinite loading of database pools
 */
export function useInfiniteDatabasePools(
  params: Omit<DatabasePoolsParams, 'page'> = {}
) {
  return useInfiniteQuery({
    queryKey: ['database-pools-infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      fetchDatabasePools({ ...params, page: pageParam as number }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 60 * 1000,
  });
}

/**
 * Get all pool base_mints from database (for merging with Jupiter API)
 */
export function useDatabasePoolMints() {
  return useQuery({
    queryKey: ['database-pool-mints'],
    queryFn: async () => {
      const response = await fetchDatabasePools({ pageSize: 100, status: 'all' });
      return new Set(response.pools.map((p) => p.base_mint));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
