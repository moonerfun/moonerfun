import Link from 'next/link';
import { Button } from '../ui/button';

type EmptyStateProps = {
  isConnected: boolean;
};

export const EmptyState = ({ isConnected }: EmptyStateProps) => {
  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/30 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
          <span className="iconify ph--wallet-bold h-8 w-8 text-neutral-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-neutral-200">
          Connect Your Wallet
        </h3>
        <p className="mb-6 text-neutral-400">
          Connect your wallet to view pools you've created and claim your rewards.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/30 p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
        <span className="iconify ph--rocket-bold h-8 w-8 text-neutral-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-200">
        No Pools Found
      </h3>
      <p className="mb-6 text-neutral-400">
        You haven't created any token pools yet. Launch your first token to start earning rewards!
      </p>
      <Button asChild className="gap-2">
        <Link href="/create-pool">
          <span className="iconify ph--rocket-bold h-4 w-4" />
          Create Your First Pool
        </Link>
      </Button>
    </div>
  );
};

export default EmptyState;
