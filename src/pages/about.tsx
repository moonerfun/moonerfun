import Page from '@/components/ui/Page/Page';
import { AboutHero, HowItWorks, FlywheelDiagram, Benefits, FAQ } from '@/components/About';
import { CTASection } from '@/components/Landing';
import Head from 'next/head';

export default function About() {
  return (
    <>
      <Head>
        <title>About | mooner.fun - The Flywheel Token Launchpad</title>
        <meta
          name="description"
          content="Learn how mooner.fun works - the flywheel token launchpad on Solana with automatic buyback and burn mechanics."
        />
      </Head>
      <Page containerClassName="px-0 pt-0">
        {/* Hero Section */}
        <AboutHero />

        {/* How It Works */}
        <HowItWorks />

        {/* Flywheel Diagram */}
        <FlywheelDiagram />

        {/* Benefits */}
        <Benefits />

        {/* FAQ */}
        <FAQ />

        {/* CTA */}
        <CTASection />
      </Page>
    </>
  );
}
