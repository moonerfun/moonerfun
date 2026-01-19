import { memo } from 'react';
import { MetricBurned, MetricFdv, MetricHolders, MetricLiquidity, MetricMcap } from './TokenMetric/TokenMetric';
import { cn } from '@/lib/utils';

type TokenMetricsProps = {
  className?: string;
};

export const TokenMetrics: React.FC<TokenMetricsProps> = memo(({ className }) => {
  return (
    <div className={cn('rounded-xl border border-neutral-800 bg-neutral-900/50 divide-y divide-neutral-800', className)}>
      <MetricMcap className="text-sm px-4 py-3" />
      <MetricFdv className="text-sm px-4 py-3" />
      <MetricLiquidity className="text-sm px-4 py-3" />
      <MetricHolders className="text-sm px-4 py-3" />
      <MetricBurned className="text-sm px-4 py-3" />
    </div>
  );
});

TokenMetrics.displayName = 'TokenMetrics';
