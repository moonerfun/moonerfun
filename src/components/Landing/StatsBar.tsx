import { cn } from '@/lib/utils';

type StatItemProps = {
  label: string;
  value: string;
  icon: string;
  iconColor?: string;
};

const StatItem = ({ label, value, icon, iconColor = 'text-primary' }: StatItemProps) => (
  <div className="flex flex-col items-center gap-1 px-4 py-2 md:flex-row md:gap-3">
    <span className={cn('iconify h-6 w-6', icon, iconColor)} />
    <div className="text-center md:text-left">
      <div className="text-xl font-bold text-neutral-100 md:text-2xl">{value}</div>
      <div className="text-xs text-neutral-500 md:text-sm">{label}</div>
    </div>
  </div>
);

export const StatsBar = () => {
  // TODO: Fetch real stats from API
  const stats = [
    {
      label: 'Tokens Launched',
      value: '247+',
      icon: 'ph--rocket-fill',
      iconColor: 'text-primary',
    },
    {
      label: 'SOL Collected',
      value: '1,234',
      icon: 'ph--coins-fill',
      iconColor: 'text-gold-400',
    },
    {
      label: 'Tokens Burned',
      value: '892K',
      icon: 'ph--fire-fill',
      iconColor: 'text-rose-400',
    },
    {
      label: '24h Volume',
      value: '45.2K SOL',
      icon: 'ph--chart-line-up-fill',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <section className="border-y border-neutral-800 bg-neutral-900/50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 divide-neutral-800 md:grid-cols-4 md:divide-x">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
