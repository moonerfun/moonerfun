import { cn } from '@/lib/utils';

const formatUSD = (num: number): string => {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

type RewardsSummaryProps = {
  totalEarned30d: number;
  totalClaimableUsd?: number;
  claimablePoolCount?: number;
  totalPools: number;
  migratedPools: number;
  onClaimAll?: () => void;
  isClaimingAll?: boolean;
};

export const RewardsSummary = ({
  totalEarned30d,
  totalClaimableUsd = 0,
  claimablePoolCount = 0,
  totalPools,
  migratedPools,
  onClaimAll,
  isClaimingAll = false,
}: RewardsSummaryProps) => {
  const hasClaimable = totalClaimableUsd > 0;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-900/10 p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Stats */}
        <div className="flex flex-wrap gap-8">
          {/* Claimable Now - Primary metric */}
          <div>
            <p className="text-sm text-neutral-500">Claimable Now</p>
            <p className={cn(
              "text-3xl font-bold",
              hasClaimable ? "text-emerald-400" : "text-neutral-500"
            )}>
              {formatUSD(totalClaimableUsd)}
            </p>
            {claimablePoolCount > 0 && (
              <p className="text-xs text-neutral-500 mt-0.5">
                from {claimablePoolCount} pool{claimablePoolCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="border-l border-neutral-800 pl-8">
            <p className="text-sm text-neutral-500">Earned (30d est.)</p>
            <p className="text-2xl font-bold text-neutral-300">
              {formatUSD(totalEarned30d)}
            </p>
          </div>
          <div className="border-l border-neutral-800 pl-8">
            <p className="text-sm text-neutral-500">Your Pools</p>
            <p className="text-2xl font-bold text-neutral-100">{totalPools}</p>
          </div>
          <div className="border-l border-neutral-800 pl-8">
            <p className="text-sm text-neutral-500">Migrated</p>
            <p className="text-2xl font-bold text-neutral-100">{migratedPools}</p>
          </div>
        </div>

        {/* Claim All Button */}
        <button
          onClick={onClaimAll}
          disabled={isClaimingAll || !hasClaimable}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all',
            hasClaimable 
              ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
              : 'bg-neutral-700 text-neutral-400',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {isClaimingAll ? (
            <>
              <span className="iconify ph--spinner animate-spin h-5 w-5" />
              Claiming...
            </>
          ) : hasClaimable ? (
            <>
              <span className="iconify ph--hand-coins-bold h-5 w-5" />
              Claim All ({formatUSD(totalClaimableUsd)})
            </>
          ) : (
            <>
              <span className="iconify ph--check-circle h-5 w-5" />
              No Fees to Claim
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RewardsSummary;
