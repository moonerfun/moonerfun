import { PoolRewardsCard, type PoolReward } from './PoolRewardsCard';
import type { ClaimableFeeInfo } from '@/hooks/useCreatorFeeBalances';

type CreatorFees = {
  fee24h: number;
  fee7d: number;
  fee30d: number;
};

type PoolRewardsListProps = {
  pools: PoolReward[];
  partnerFees?: Record<string, CreatorFees>;
  feeBalances?: Record<string, ClaimableFeeInfo>;
  onClaim?: (baseMint: string) => void;
  claimingPool?: string | null;
};

export const PoolRewardsList = ({
  pools,
  partnerFees = {},
  feeBalances = {},
  onClaim,
  claimingPool,
}: PoolRewardsListProps) => {
  // Sort: pools with claimable fees first, then migrated, then by created_at
  const sortedPools = [...pools].sort((a, b) => {
    // First priority: has claimable fees
    const aHasFees = feeBalances[a.base_mint]?.hasClaimableFees ?? false;
    const bHasFees = feeBalances[b.base_mint]?.hasClaimableFees ?? false;
    if (aHasFees && !bHasFees) return -1;
    if (!aHasFees && bHasFees) return 1;
    
    // Second priority: migrated
    if (a.is_migrated && !b.is_migrated) return -1;
    if (!a.is_migrated && b.is_migrated) return 1;
    
    // Third priority: created_at
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      {sortedPools.map((pool) => (
        <PoolRewardsCard
          key={pool.id}
          pool={pool}
          partnerFees={partnerFees[pool.damm_pool_address || '']}
          feeBalance={feeBalances[pool.base_mint]}
          onClaim={onClaim}
          isClaiming={claimingPool === pool.base_mint}
        />
      ))}
    </div>
  );
};

export default PoolRewardsList;
