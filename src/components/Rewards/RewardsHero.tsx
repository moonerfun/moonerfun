import Link from 'next/link';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Button } from '../ui/button';

export const RewardsHero = () => {
  const { publicKey } = useWallet();

  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
      <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Content */}
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
          <span className="iconify ph--gift-fill h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">Creator Rewards</span>
        </div>
        
        <h1 className="mb-4 text-3xl font-bold text-neutral-100 md:text-4xl">
          Claim Your Rewards
        </h1>
        
        <p className="mx-auto max-w-xl text-neutral-400">
          As a token creator, you earn <span className="text-emerald-400 font-semibold">20%</span> of all trading fees 
          from your migrated pools. Connect your wallet to view and claim your rewards.
        </p>

        {!publicKey && (
          <div className="mt-8">
            <Button asChild size="lg" className="gap-2">
              <Link href="#connect">
                <span className="iconify ph--wallet-bold h-5 w-5" />
                Connect Wallet to View Rewards
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default RewardsHero;
