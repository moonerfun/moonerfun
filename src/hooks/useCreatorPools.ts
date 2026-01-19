import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@jup-ag/wallet-adapter';
import type { PoolReward } from '@/components/Rewards';

type CreatorPoolsResponse = {
  pools: PoolReward[];
  total_pools: number;
  migrated_pools: number;
};

const FLYWHEEL_API_URL = process.env.NEXT_PUBLIC_FLYWHEEL_API_URL || 'http://localhost:3001';

async function fetchCreatorPools(walletAddress: string): Promise<CreatorPoolsResponse> {
  const response = await fetch(`${FLYWHEEL_API_URL}/pools/creator/${walletAddress}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch creator pools');
  }
  
  return response.json();
}

export function useCreatorPools() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  const query = useQuery({
    queryKey: ['creatorPools', walletAddress],
    queryFn: () => fetchCreatorPools(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });

  return {
    pools: query.data?.pools || [],
    totalPools: query.data?.total_pools || 0,
    migratedPools: query.data?.migrated_pools || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useCreatorPools;
