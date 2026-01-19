import Explore from '@/components/Explore';
import Page from '@/components/ui/Page/Page';
import { SectionHeader } from '@/components/Landing';

export default function ExplorePage() {
  return (
    <Page>
      <section className="py-4">
        <SectionHeader
          title="Explore Tokens"
          subtitle="Discover new tokens launching on the flywheel, see what's graduating, and track graduated pools."
        />
        <Explore />
      </section>
    </Page>
  );
}
