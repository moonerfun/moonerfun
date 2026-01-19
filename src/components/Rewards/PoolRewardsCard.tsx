import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import type { MeteoraPoolWithMetrics } from '@/hooks/useMeteoraPool';
import type { ClaimableFeeInfo } from '@/hooks/useCreatorFeeBalances';

export type PoolReward = {
  id: string;
  pool_address: string;
  damm_pool_address: string | null;
  base_mint: string;
  name: string | null;
  symbol: string | null;
  is_migrated: boolean;
  rewards_available: boolean;
  total_fees_collected_sol: number;
  created_at: string;
  // Extended fields from API
  current_marketcap_usd?: number;
  current_price_usd?: number;
  total_tokens_bought?: number;
  total_tokens_burned?: number;
  status?: string;
  // Meteora data
  meteora?: MeteoraPoolWithMetrics;
};

type PartnerFees = {
  fee24h: number;
  fee7d: number;
  fee30d: number;
};

const formatNumber = (num: number, decimals = 2): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

const formatUSD = (num: number): string => {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const formatSOL = (num: number): string => {
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K SOL`;
  if (num >= 1) return `${num.toFixed(4)} SOL`;
  if (num >= 0.0001) return `${num.toFixed(6)} SOL`;
  return `${num.toExponential(2)} SOL`;
};

type PoolRewardsCardProps = {
  pool: PoolReward;
  partnerFees?: PartnerFees;
  feeBalance?: ClaimableFeeInfo;
  onClaim?: (baseMint: string) => void;
  isClaiming?: boolean;
};

export const PoolRewardsCard = ({
  pool,
  partnerFees,
  feeBalance,
  onClaim,
  isClaiming = false,
}: PoolRewardsCardProps) => {
  const isMigrated = pool.is_migrated && pool.damm_pool_address;
  const meteora = pool.meteora;
  const jupiter = meteora?.jupiter;
  const baseAsset = jupiter?.baseAsset;
  
  // Claimable fee info
  const hasClaimable = feeBalance?.hasClaimableFees && feeBalance?.isCreator;
  const claimableUsd = feeBalance?.creatorQuoteFeeUsd ?? 0;
  const claimableSol = feeBalance?.creatorQuoteFee ? feeBalance.creatorQuoteFee.toNumber() / 1e9 : 0;
  
  // Use Jupiter data for display (most complete), fallback chain
  const tokenSymbol = baseAsset?.symbol || meteora?.token_a_symbol || pool.symbol;
  const tokenName = baseAsset?.name || pool.name;
  const displayName = tokenSymbol || tokenName || `${pool.base_mint.slice(0, 4)}...${pool.base_mint.slice(-4)}`;
  const tokenIcon = baseAsset?.icon;
  const priceChange24h = baseAsset?.stats24h?.priceChange;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition-colors hover:border-neutral-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Token Info */}
        <div className="flex items-center gap-4">
          {tokenIcon ? (
            <img 
              src={tokenIcon} 
              alt="" 
              className="h-12 w-12 rounded-xl bg-neutral-800 object-cover"
              onError={(e) => {
                // Fallback to emoji if image fails
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 text-2xl", tokenIcon && "hidden")}>
            🪙
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-neutral-100">
                {displayName}
              </h3>
              {tokenName && tokenSymbol && tokenName !== tokenSymbol && (
                <span className="text-sm text-neutral-500">
                  {tokenName}
                </span>
              )}
              {isMigrated ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  <span className="iconify ph--check-circle-fill h-3 w-3" />
                  Migrated
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                  <span className="iconify ph--chart-line-up-fill h-3 w-3" />
                  Bonding Curve
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-sm text-neutral-500">
              <span>Mint: {pool.base_mint.slice(0, 6)}...{pool.base_mint.slice(-4)}</span>
              {baseAsset?.holderCount !== undefined && (
                <span className="flex items-center gap-1">
                  <span className="iconify ph--users-bold h-3.5 w-3.5" />
                  {formatNumber(baseAsset.holderCount, 0)} holders
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Claimable Amount & Claim Button */}
        <div className="flex items-center gap-6">
          {/* Claimable Now - On-chain balance */}
          <div className="text-right">
            <p className="text-sm text-neutral-500">Claimable Now</p>
            {hasClaimable ? (
              <>
                <p className="text-lg font-bold text-emerald-400">
                  {formatSOL(claimableSol)}
                </p>
                <p className="text-xs text-neutral-500">
                  ≈ {formatUSD(claimableUsd)}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold text-neutral-500">—</p>
            )}
          </div>
          <Button
            onClick={() => onClaim?.(pool.base_mint)}
            disabled={isClaiming || !hasClaimable}
            variant={hasClaimable ? "default" : "secondary"}
            className="gap-2"
          >
            {isClaiming ? (
              <>
                <span className="iconify ph--spinner animate-spin h-4 w-4" />
                Claiming...
              </>
            ) : hasClaimable ? (
              <>
                <span className="iconify ph--hand-coins-bold h-4 w-4" />
                Claim
              </>
            ) : (
              <>
                <span className="iconify ph--check-circle h-4 w-4" />
                No Fees
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Row - Jupiter + Meteora Data */}
      {isMigrated && (baseAsset || meteora) && (
        <div className="mt-4 flex flex-wrap gap-6 border-t border-neutral-800 pt-4">
          {/* Jupiter data (preferred) */}
          {baseAsset?.mcap !== undefined && baseAsset.mcap > 0 && (
            <div>
              <p className="text-xs text-neutral-500">Market Cap</p>
              <p className="font-medium text-neutral-300">
                {formatUSD(baseAsset.mcap)}
              </p>
            </div>
          )}
          {baseAsset?.usdPrice !== undefined && (
            <div>
              <p className="text-xs text-neutral-500">Price</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-neutral-300">
                  ${baseAsset.usdPrice < 0.0001 
                    ? baseAsset.usdPrice.toExponential(2) 
                    : baseAsset.usdPrice.toFixed(6)}
                </p>
                {priceChange24h !== undefined && (
                  <span className={cn(
                    'text-xs font-medium',
                    priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Jupiter volume preferred, fallback to Meteora */}
          {(jupiter?.volume24h || meteora?.volume24h) && (
            <div>
              <p className="text-xs text-neutral-500">Volume (24h)</p>
              <p className="font-medium text-neutral-300">
                {formatUSD(jupiter?.volume24h || meteora?.volume24h || 0)}
              </p>
            </div>
          )}
          {/* Jupiter liquidity preferred, fallback to Meteora TVL */}
          {(baseAsset?.liquidity || meteora?.tvl) && (
            <div>
              <p className="text-xs text-neutral-500">Liquidity</p>
              <p className="font-medium text-neutral-300">
                {formatUSD(baseAsset?.liquidity || meteora?.tvl || 0)}
              </p>
            </div>
          )}
          {meteora?.apr !== undefined && meteora.apr > 0 && (
            <div>
              <p className="text-xs text-neutral-500">APR</p>
              <p className="font-medium text-emerald-400">
                {meteora.apr.toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fee Estimates - Show estimated earnings from trading volume */}
      {isMigrated && partnerFees && (partnerFees.fee24h > 0 || partnerFees.fee7d > 0 || partnerFees.fee30d > 0) && (
        <div className="mt-4 flex flex-wrap gap-6 border-t border-neutral-800 pt-4">
          <div>
            <p className="text-xs text-neutral-500">Earned (24h est.)</p>
            <p className="font-medium text-neutral-400">
              {formatUSD(partnerFees.fee24h)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Earned (7d est.)</p>
            <p className="font-medium text-neutral-400">
              {formatUSD(partnerFees.fee7d)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Earned (30d est.)</p>
            <p className="font-medium text-neutral-400">
              {formatUSD(partnerFees.fee30d)}
            </p>
          </div>
        </div>
      )}

      {/* Not creator warning */}
      {feeBalance && !feeBalance.isCreator && (
        <div className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2">
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <span className="iconify ph--warning h-3 w-3" />
            You are not the creator of this pool. Only the creator can claim fees.
          </p>
        </div>
      )}
    </div>
  );
};

export default PoolRewardsCard;
