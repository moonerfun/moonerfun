import Link from 'next/link';
import { Button } from '../ui/button';

export const HeroBanner = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-cosmic-900/10 to-transparent" />
      <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-20 right-1/4 h-40 w-40 rounded-full bg-cosmic-500/10 blur-2xl" />
      <div className="absolute top-40 left-1/4 h-32 w-32 rounded-full bg-gold-500/10 blur-2xl" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24 lg:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <span className="text-lg">🌙</span>
            <span className="text-sm font-medium text-primary">Powered by Meteora DBC</span>
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            <span className="text-neutral-100">The </span>
            <span className="bg-gradient-to-r from-primary via-gold-400 to-primary bg-clip-text text-transparent">
              Flywheel
            </span>
            <span className="text-neutral-100"> Token Launchpad</span>
          </h1>

          {/* Tagline */}
          <p className="mt-6 max-w-2xl text-lg text-neutral-400 md:text-xl">
            Launch your token on a fair bonding curve. Once migrated, trading fees power our 
            flywheel system with automatic buyback & burn mechanics.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/create-pool">
                <span className="iconify ph--rocket-bold h-5 w-5" />
                Launch Your Token
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/about">
                <span className="iconify ph--book-open-bold h-5 w-5" />
                Learn How It Works
              </Link>
            </Button>
          </div>

         
          
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
