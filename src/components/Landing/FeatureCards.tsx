import { cn } from '@/lib/utils';

type FeatureCardProps = {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  className?: string;
};

const FeatureCard = ({ icon, iconColor, title, description, className }: FeatureCardProps) => (
  <div
    className={cn(
      'group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700 hover:bg-neutral-900',
      className
    )}
  >
    {/* Glow Effect */}
    <div
      className={cn(
        'absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-20',
        iconColor.replace('text-', 'bg-')
      )}
    />

    {/* Icon */}
    <div
      className={cn(
        'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900',
        'transition-colors group-hover:border-neutral-700'
      )}
    >
      <span className={cn('iconify h-6 w-6', icon, iconColor)} />
    </div>

    {/* Content */}
    <h3 className="mb-2 text-lg font-semibold text-neutral-100">{title}</h3>
    <p className="text-sm leading-relaxed text-neutral-400">{description}</p>
  </div>
);

export const FeatureCards = () => {
  const features = [
    {
      icon: 'ph--arrows-clockwise-bold',
      iconColor: 'text-cosmic-400',
      title: 'Flywheel Mechanics',
      description:
        'After migration, 80% of trading fees power the flywheel to buy back $MOONER, while 20% goes directly to you as the token creator.',
    },
    {
      icon: 'ph--fire-bold',
      iconColor: 'text-rose-400',
      title: 'Automatic Burns',
      description:
        'Bought-back $MOONER tokens are permanently burned after migration, reducing supply and creating deflationary pressure for the ecosystem.',
    },
    {
      icon: 'ph--chart-line-up-bold',
      iconColor: 'text-emerald-400',
      title: 'Fair Bonding Curve',
      description:
        'Launch on Meteora\'s Dynamic Bonding Curve with fair pricing mechanics. No presales, no team tokens—everyone starts equal.',
    },
    {
      icon: 'ph--lightning-bold',
      iconColor: 'text-gold-400',
      title: 'Instant Liquidity',
      description:
        'Your token is immediately tradeable after launch. The bonding curve ensures there\'s always liquidity available for buyers and sellers.',
    },
    {
      icon: 'ph--shield-check-bold',
      iconColor: 'text-primary',
      title: 'Non-Custodial',
      description:
        'All operations happen on-chain through smart contracts. You maintain full control of your tokens and the flywheel runs autonomously.',
    },
    {
      icon: 'ph--eye-bold',
      iconColor: 'text-neutral-400',
      title: 'Fully Transparent',
      description:
        'Every collection, buyback, and burn is recorded on-chain. Track the flywheel\'s performance with real-time on-chain data.',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-100 md:text-4xl">
            Why Launch on{' '}
            <span className="text-primary">mooner.fun</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-neutral-400">
            Launch on a fair bonding curve, and once migrated, the flywheel mechanism kicks in—trading fees power automatic buyback & burn.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
