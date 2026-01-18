import { useTokenInfo } from '@/hooks/queries';
import { formatReadablePercentChange } from '@/lib/format/number';
import { cn } from '@/lib/utils';

type BondingCurveProps = {
  className?: string;
};

export const BondingCurve: React.FC<BondingCurveProps> = ({ className }) => {
  const { data: bondingCurve } = useTokenInfo((data) => data?.bondingCurve);
  if (bondingCurve === undefined || bondingCurve >= 100) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-neutral-200">Bonding Curve</span>
        <span className="text-primary font-medium">{formatReadablePercentChange(bondingCurve / 100, { hideSign: 'positive' })}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all"
          style={{ width: `${bondingCurve}%` }}
        />
      </div>
    </div>
  );
};

export const MobileBondingCurve: React.FC<BondingCurveProps> = ({ className }) => {
  const { data: bondingCurve } = useTokenInfo((data) => data?.bondingCurve);
  if (bondingCurve === undefined || bondingCurve >= 100) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-1 pt-2', className)}>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        Bonding Curve:
        <span>{formatReadablePercentChange(bondingCurve / 100, { hideSign: 'positive' })}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-850">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${bondingCurve}%` }}
        />
      </div>
    </div>
  );
};
