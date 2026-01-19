import { cn } from '@/lib/utils';

type BenefitItemProps = {
  icon: string;
  text: string;
};

const BenefitItem = ({ icon, text }: BenefitItemProps) => (
  <li className="flex items-start gap-3">
    <span className={cn('iconify mt-0.5 h-5 w-5 shrink-0 text-primary', icon)} />
    <span className="text-neutral-300">{text}</span>
  </li>
);

export const Benefits = () => {
  const creatorBenefits = [
    { icon: 'ph--check-circle-fill', text: 'Launch in minutes with no coding required' },
    { icon: 'ph--check-circle-fill', text: 'Fair bonding curve pricing from day one' },
    { icon: 'ph--check-circle-fill', text: 'No presale allocations or team tokens' },
    { icon: 'ph--check-circle-fill', text: 'Instant liquidity on the bonding curve' },
    { icon: 'ph--check-circle-fill', text: 'Flywheel activates after migration to DAMM' },
    { icon: 'ph--check-circle-fill', text: 'Transparent on-chain mechanics' },
  ];

  const holderBenefits = [
    { icon: 'ph--check-circle-fill', text: '$MOONER burns from migrated pool trading' },
    { icon: 'ph--check-circle-fill', text: 'Trading activity drives ecosystem value' },
    { icon: 'ph--check-circle-fill', text: 'Continuous buyback pressure post-migration' },
    { icon: 'ph--check-circle-fill', text: 'Fair entry price for everyone' },
    { icon: 'ph--check-circle-fill', text: 'Non-custodial and permissionless' },
    { icon: 'ph--check-circle-fill', text: 'Verifiable on-chain transactions' },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-100 md:text-4xl">
            Benefits for Everyone
          </h2>
          <p className="mx-auto max-w-2xl text-neutral-400">
            Whether you're launching a token or investing in one, the flywheel system is designed to benefit all participants.
          </p>
        </div>

        {/* Two Column Benefits */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* For Creators */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <span className="iconify ph--rocket-fill h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-100">For Token Creators</h3>
            </div>
            <ul className="space-y-4">
              {creatorBenefits.map((benefit, index) => (
                <BenefitItem key={index} {...benefit} />
              ))}
            </ul>
          </div>

          {/* For Holders */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <span className="iconify ph--wallet-fill h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-100">For Token Holders</h3>
            </div>
            <ul className="space-y-4">
              {holderBenefits.map((benefit, index) => (
                <BenefitItem key={index} {...benefit} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
