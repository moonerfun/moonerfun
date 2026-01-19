import { cn } from '@/lib/utils';

type StepProps = {
  number: number;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
};

const Step = ({ number, icon, iconColor, title, description }: StepProps) => (
  <div className="relative flex flex-col items-center text-center">
    {/* Step Number Badge */}
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-xl font-bold text-primary">
      {number}
    </div>

    {/* Icon */}
    <div
      className={cn(
        'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900'
      )}
    >
      <span className={cn('iconify h-8 w-8', icon, iconColor)} />
    </div>

    {/* Content */}
    <h3 className="mb-2 text-lg font-semibold text-neutral-100">{title}</h3>
    <p className="text-sm text-neutral-400">{description}</p>
  </div>
);

export const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: 'ph--rocket-bold',
      iconColor: 'text-primary',
      title: 'Launch Your Token',
      description:
        'Create your token pool in minutes. Set your token name, symbol, and upload your logo. No coding required.',
    },
    {
      number: 2,
      icon: 'ph--arrows-left-right-bold',
      iconColor: 'text-emerald-400',
      title: 'Trading Begins',
      description:
        'Your token is immediately tradeable on the bonding curve. Trade until you reach the migration threshold.',
    },
    {
      number: 3,
      icon: 'ph--graduation-cap-bold',
      iconColor: 'text-cosmic-400',
      title: 'Token Migrates',
      description:
        'Once the bonding curve fills, your token migrates to Meteora DAMM with deep liquidity.',
    },
    {
      number: 4,
      icon: 'ph--coins-bold',
      iconColor: 'text-gold-400',
      title: 'Flywheel Activates',
      description:
        'After migration, trading fees are collected from your pool and used to buy back $MOONER tokens.',
    },
    {
      number: 5,
      icon: 'ph--fire-bold',
      iconColor: 'text-rose-400',
      title: 'Tokens Burned',
      description:
        'Bought-back $MOONER tokens are permanently burned, reducing supply and benefiting the ecosystem.',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-100 md:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-neutral-400">
            Launch on the bonding curve, migrate to DAMM, and then the flywheel activates—creating a self-sustaining cycle.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <Step {...step} />
              {/* Connector Arrow - only on desktop and not for last item */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-20 hidden translate-x-1/2 md:block">
                  <span className="iconify ph--arrow-right-bold h-6 w-6 text-neutral-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
