import { useTokenAddress } from '@/hooks/queries';
import { TokenDescription } from './TokenDescription';
import { BondingCurve } from './BondingCurve';

import { TokenMetrics } from './TokenMetrics';
import { Checklist } from './TokenChecklist';

export const TokenDetails: React.FC = () => {
  const tokenId = useTokenAddress();

  return (
    <div className="flex flex-col gap-4">
      <TokenMetrics key={`token-metrics-${tokenId}`} />
      
      {/* Bonding Curve - separate card since it may be null */}
      <BondingCurve key={`bonding-curve-${tokenId}`} className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3" />
      
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden divide-y divide-neutral-800">
        <TokenDescription />
        <Checklist />
      </div>
    </div>
  );
};
