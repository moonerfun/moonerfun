import Explore from '@/components/Explore';
import Page from '@/components/ui/Page/Page';
import { HeroBanner, StatsBar, FeatureCards, CTASection, SectionHeader } from '@/components/Landing';

export default function Index() {
  return (
    <Page containerClassName="px-0 pt-0">
      {/* Hero Section */}
      <HeroBanner />

      {/* Stats Bar */}
      {/* <StatsBar /> */}

      {/* Features Section */}
      {/* <FeatureCards /> */}

      {/* Explore Section */}
      <section className="px-4 md:px-6 lg:px-8 pb-8">
        <SectionHeader
          title="Explore Tokens"
          subtitle="Discover new tokens launching on the flywheel, see what's graduating, and track graduated pools."
        />
        <Explore />
      </section>

      {/* CTA Section */}
      <CTASection />
    </Page>
  );
}
