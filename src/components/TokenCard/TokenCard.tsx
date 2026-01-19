import React from 'react';

import { Pool, TokenListTimeframe } from '../Explore/types';

import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/Skeleton';
import { TrenchesPoolTokenIcon } from '../TokenIcon/TokenIcon';
import { Copyable } from '../ui/Copyable';
import CopyIconSVG from '@/icons/CopyIconSVG';
import { TokenAge } from '../TokenAge';
import { TokenSocials } from '../TokenSocials';
import { TokenCardBurnedMetric, TokenCardMcapMetric, TokenCardVolumeMetric } from './TokenCardMetric';
import Link from 'next/link';
import { getPoolLabel, getPoolLabelConfig, isPoolLabelsEnabled } from '@/lib/pool-labels';

type TokenCardProps = {
  pool: Pool;
  timeframe: TokenListTimeframe;
  rowRef: (element: HTMLElement | null, poolId: string) => void;
};

export const TokenCard: React.FC<TokenCardProps> = ({ pool, timeframe, rowRef }) => {
  const stats = pool.baseAsset[`stats${timeframe}`];
  const poolLabel = isPoolLabelsEnabled() ? getPoolLabel(pool.createdAt) : null;
  const labelConfig = getPoolLabelConfig(poolLabel);

  return (
    <div
      ref={(el) => rowRef(el, pool.id)}
      data-pool-id={pool.id}
      className="relative flex cursor-pointer items-center border-neutral-800 py-5 px-4 text-sm has-hover:hover:bg-neutral-900/50 [&:nth-child(n+2)]:border-t transition-colors"
    >
      <div className="shrink-0 pr-5">
        <TrenchesPoolTokenIcon width={72} height={72} pool={pool} />
      </div>

      {/* Info */}
      <div className="flex w-full flex-col gap-1 overflow-hidden">
        {/* 1st row */}
        <div className="flex w-full items-center justify-between">
          <div className="overflow-hidden">
            <div className="flex items-center gap-0.5 xl:gap-1">
              <div
                className="whitespace-nowrap text-base font-bold text-neutral-100"
                title={pool.baseAsset.symbol}
              >
                {pool.baseAsset.symbol}
              </div>

              {/* Pool Label Badge */}
              {labelConfig && (
                <span
                  className={cn(
                    'ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium border',
                    labelConfig.className
                  )}
                >
                  {labelConfig.text}
                </span>
              )}

              <div className="ml-1 flex items-center gap-1 overflow-hidden z-10">
                <Copyable
                  name="Address"
                  copyText={pool.baseAsset.id}
                  className="z-[1] flex min-w-0 items-center gap-0.5 text-[0.625rem] leading-none text-neutral-500 duration-500 hover:text-neutral-200 data-[copied=true]:text-primary"
                >
                  {(copied) => (
                    <>
                      <div className="truncate text-xs" title={pool.baseAsset.name}>
                        {pool.baseAsset.name}
                      </div>
                      {copied ? (
                        <div className="iconify h-3 w-3 shrink-0 text-primary ph--check-bold" />
                      ) : (
                        <CopyIconSVG className="h-3 w-3 shrink-0" width={12} height={12} />
                      )}
                    </>
                  )}
                </Copyable>
              </div>
            </div>

            {/* Interesting metrics */}
            {/* <div className="flex items-center gap-1 pt-0.5 text-neutral-500 sm:gap-1.5">
              <TokenCardTopHoldersMetric audit={pool.baseAsset.audit} />
              <TokenCardHoldersMetric holderCount={pool.baseAsset.holderCount} />
            </div> */}
          </div>
        </div>

        {/* 2nd row */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TokenAge className="opacity-80" date={pool.createdAt} />
            <TokenSocials className="z-[1]" token={pool.baseAsset} />
          </div>

          {/* Token metric */}
          <div className="flex items-center gap-2.5">
            <TokenCardBurnedMetric totalSupply={pool.baseAsset.totalSupply} />
            <TokenCardVolumeMetric buyVolume={stats?.buyVolume} sellVolume={stats?.sellVolume} />
            <TokenCardMcapMetric mcap={pool.baseAsset.mcap} />
          </div>
        </div>
      </div>

      <Link
        className="absolute inset-0 cursor-pointer rounded-lg"
        href={`/token/${pool.baseAsset.id}`}
      />
    </div>
  );
};

type TokenCardSkeletonProps = React.ComponentPropsWithoutRef<'div'>;

export const TokenCardSkeleton: React.FC<TokenCardSkeletonProps> = ({ className, ...props }) => (
  <div className={cn('border-b border-neutral-800 py-5 px-4 text-sm', className)} {...props}>
    <div className="flex items-center">
      {/* Icon */}
      <div className="shrink-0 pr-5">
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
      </div>

      {/* Info */}
      <div className="flex w-full flex-col gap-2 overflow-hidden">
        {/* 1st row */}
        <div className="flex w-full items-center justify-between gap-1">
          {/* Left side: Symbol, Name, Icons, Metrics */}
          <div className="flex flex-col gap-1 overflow-hidden">
            {/* Symbol/Name/Icons */}
            <div className="flex items-center gap-1">
              <Skeleton className="h-5 w-16" /> {/* Symbol */}
            </div>
            {/* Metrics */}
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          {/* Right side: Quickbuy */}
          <div className="shrink-0">
            <Skeleton className="h-6 w-6 rounded-full lg:w-12" />
          </div>
        </div>

        {/* 2nd row */}
        <div className="flex w-full items-center justify-between">
          {/* Left side: Age, Socials */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-10" />
          </div>

          {/* Right side: Volume, MC */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-5 w-10" /> {/* V */}
            <Skeleton className="h-5 w-10" /> {/* MC */}
          </div>
        </div>
      </div>
    </div>
  </div>
);
