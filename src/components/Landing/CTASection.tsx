import Link from 'next/link';
import { Button } from '../ui/button';

export const CTASection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-cosmic-900/20">
          {/* Background Effects */}
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-cosmic-500/10 blur-3xl" />

          {/* Content */}
          <div className="relative px-6 py-16 text-center md:px-12 md:py-20">
            <div className="mb-4 text-5xl">🚀</div>
            <h2 className="mb-4 text-3xl font-bold text-neutral-100 md:text-4xl">
              Ready to Launch Your Token?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-neutral-400">
              Launch on a fair bonding curve. Once your token migrates, trading fees 
              power the flywheel with automatic $MOONER buyback & burn.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/create-pool">
                  <span className="iconify ph--rocket-bold h-5 w-5" />
                  Create Your Pool
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/about">
                  <span className="iconify ph--question-bold h-5 w-5" />
                  How It Works
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
