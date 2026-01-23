import { useCallback, useMemo, useState } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import Page from '@/components/ui/Page/Page';
import Head from 'next/head';
import {
  RewardsHero,
  PoolRewardsList,
  RewardsSummary,
  EmptyState,
} from '@/components/Rewards';
import { useCreatorPools } from '@/hooks/useCreatorPools';
import { useMeteoraPoolsData } from '@/hooks/useMeteoraPool';
import { useClaimCreatorFees } from '@/hooks/useClaimCreatorFees';
import { useCreatorFeeBalances } from '@/hooks/useCreatorFeeBalances';

export default function RewardsPage() {
  const { publicKey } = useWallet();
  const { pools, totalPools, migratedPools, isLoading, isError, refetch } = useCreatorPools();
  const { claimFees, isLoading: isClaiming, claimingPool } = useClaimCreatorFees();
  const [isClaimingAll, setIsClaimingAll] = useState(false);

  // Get all base mints for fee balance lookup
  const baseMints = useMemo(() => pools.map(p => p.base_mint), [pools]);
  
  // Fetch actual claimable fee balances from DBC pools
  const { 
    feeBalances, 
    totals: feeTotals, 
    isLoading: isLoadingFees,
    refetch: refetchFees 
  } = useCreatorFeeBalances(baseMints);

  // Get DAMM pool addresses with base mints for migrated pools
  const poolsWithMints = useMemo(() => 
    pools
      .filter(p => p.is_migrated && p.damm_pool_address)
      .map(p => ({ 
        poolAddress: p.damm_pool_address as string,
        baseMint: p.base_mint,
      })),
    [pools]
  );

  // Fetch Meteora + Jupiter data for all migrated pools
  const { data: meteoraPoolsData, isFetching: isFetchingMeteora, isLoading: isLoadingMeteoraRaw } = useMeteoraPoolsData(poolsWithMints);
  // Only show Meteora as loading if we actually have pools to fetch
  const isLoadingMeteora = poolsWithMints.length > 0 && (isFetchingMeteora || isLoadingMeteoraRaw);

  // Merge Meteora/Jupiter data with our pools
  const poolsWithMeteoraData = useMemo(() => {
    return pools.map(pool => {
      if (pool.damm_pool_address && meteoraPoolsData?.[pool.damm_pool_address]) {
        const meteoraData = meteoraPoolsData[pool.damm_pool_address];
        const jupiterData = meteoraData.jupiter;
        return {
          ...pool,
          // Override with Jupiter data (more complete), fallback to Meteora
          name: jupiterData?.baseAsset?.name || meteoraData.pool_name || pool.name,
          symbol: jupiterData?.baseAsset?.symbol || meteoraData.token_a_symbol || pool.symbol,
          meteora: meteoraData,
        };
      }
      return pool;
    });
  }, [pools, meteoraPoolsData]);

  // Note: Creator trading fees accumulate in the DBC pool during bonding curve phase
  // The Meteora partner_fee is for the launchpad, not the token creator
  // We calculate display fees from Meteora metrics but actual claimable fees come from DBC
  const displayFees = useMemo(() => {
    const fees: Record<string, { fee24h: number; fee7d: number; fee30d: number }> = {};
    if (meteoraPoolsData) {
      Object.entries(meteoraPoolsData).forEach(([addr, data]) => {
        if (data.metrics) {
          // Use LP fees as an estimate (creator gets 20% of total trading fees)
          // This is for display only - actual claimable amount comes from DBC pool
          const creatorShare = 0.2;
          fees[addr] = {
            fee24h: (data.metrics.lp_fee24h || 0) * creatorShare,
            fee7d: (data.metrics.lp_fee7d || 0) * creatorShare,
            fee30d: (data.metrics.lp_fee30d || 0) * creatorShare,
          };
        }
      });
    }
    return fees;
  }, [meteoraPoolsData]);

  const totalCreatorFee30d = useMemo(() => 
    Object.values(displayFees).reduce((sum, f) => sum + f.fee30d, 0),
    [displayFees]
  );

  // Claim uses baseMint to look up the DBC pool (not the DAMM pool address)
  const handleClaim = useCallback(async (baseMint: string) => {
    const result = await claimFees(baseMint);
    if (result.success && result.txSignature) {
      // Refresh data after successful claim
      refetch();
      refetchFees(); // Also refresh fee balances
      console.log('Claim successful:', result.txSignature);
    } else if (result.error) {
      // You could show a toast notification here
      console.error('Claim failed:', result.error);
    }
  }, [claimFees, refetch, refetchFees]);

  const handleClaimAll = useCallback(async () => {
    setIsClaimingAll(true);
    try {
      // Only claim from pools with claimable fees where user is creator
      const poolsWithFees = pools.filter(p => {
        const feeInfo = feeBalances[p.base_mint];
        return feeInfo?.hasClaimableFees && feeInfo?.isCreator;
      });
      
      for (const pool of poolsWithFees) {
        await claimFees(pool.base_mint);
      }
      // Refresh data after all claims
      refetch();
      refetchFees();
    } finally {
      setIsClaimingAll(false);
    }
  }, [pools, feeBalances, claimFees, refetch, refetchFees]);

  const isLoadingAll = isLoading || isLoadingMeteora || isLoadingFees;

  return (
    <>
      <Head>
        <title>Rewards | mooner.fun - Claim Your Creator Fees</title>
        <meta
          name="description"
          content="Claim your 20% creator fee rewards from migrated token pools on mooner.fun"
        />
      </Head>
      <Page containerClassName="px-0 pt-0">
      <div className="min-h-screen">
        <RewardsHero />

        <section className="mx-auto max-w-4xl px-4 pb-16">
          {!publicKey ? (
            <EmptyState isConnected={false} />
          ) : isLoadingAll ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="iconify ph--spinner animate-spin h-8 w-8 text-emerald-400" />
              <p className="mt-4 text-neutral-400">Loading your pools...</p>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
              <span className="iconify ph--warning-circle-bold mb-4 h-12 w-12 text-red-400" />
              <h3 className="mb-2 text-lg font-semibold text-red-400">Error Loading Pools</h3>
              <p className="mb-4 text-neutral-400">
                Failed to fetch your pools. Please try again.
              </p>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-neutral-800 px-4 py-2 text-neutral-200 hover:bg-neutral-700"
              >
                Retry
              </button>
            </div>
          ) : pools.length === 0 ? (
            <EmptyState isConnected={true} />
          ) : (
            <div className="space-y-6">
              <RewardsSummary
                totalEarned30d={totalCreatorFee30d}
                totalClaimableUsd={feeTotals.totalQuoteFeeUsd}
                claimablePoolCount={feeTotals.totalClaimableCount}
                totalPools={totalPools}
                migratedPools={migratedPools}
                onClaimAll={handleClaimAll}
                isClaimingAll={isClaimingAll}
              />

              <div>
                <h2 className="mb-4 text-xl font-semibold text-neutral-100">Your Pools</h2>
                <PoolRewardsList
                  pools={poolsWithMeteoraData}
                  partnerFees={displayFees}
                  feeBalances={feeBalances}
                  onClaim={handleClaim}
                  claimingPool={claimingPool}
                />
              </div>

              {/* Info Box */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="iconify ph--info-bold mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <div className="text-sm text-neutral-400">
                    <p className="font-medium text-neutral-300">How Creator Rewards Work</p>
                    <p className="mt-1">
                      As the token creator, you earn <span className="text-emerald-400 font-medium">20% of trading fees</span> that 
                      accumulate during the bonding curve phase. These fees are stored in the DBC pool and can be claimed at any time.
                    </p>
                    <p className="mt-2">
                      After migration, the remaining 80% of trading fees power the Flywheel mechanism for token buyback and burn, 
                      increasing scarcity and supporting long-term value.
                    </p>
                    <p className="mt-2 text-neutral-500 text-xs">
                      Note: Displayed fee estimates are based on LP trading volume. Actual claimable amounts come from the bonding curve pool.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Page>
    </>
  );
}
