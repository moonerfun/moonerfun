import '@/styles/globals.css';
import { Adapter, UnifiedWalletProvider } from '@jup-ag/wallet-adapter';
import type { AppProps } from 'next/app';
import { Toaster } from 'sonner';
import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWindowWidthListener } from '@/lib/device';

// Polyfill for wallet-standard to prevent "wallets is not an array" warning
if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
  if (!Array.isArray((navigator as any).wallets)) {
    (navigator as any).wallets = [];
  }
}

export default function App({ Component, pageProps }: AppProps) {
  // Phantom, Solflare, etc. auto-register via wallet-standard, no need to add manually
  const wallets: Adapter[] = useMemo((): Adapter[] => [], []);

  const queryClient = useMemo(() => new QueryClient(), []);

  useWindowWidthListener();

  return (
    <QueryClientProvider client={queryClient}>
      <UnifiedWalletProvider
        wallets={wallets}
        config={{
          env: 'mainnet-beta',
          autoConnect: true,
          metadata: {
            name: 'mooner.fun',
            description: 'The flywheel token launchpad',
            url: 'https://mooner.fun',
            iconUrls: ['https://mooner.fun/favicon.ico'],
          },
          // notificationCallback: WalletNotification,
          theme: 'dark',
          lang: 'en',
        }}
      >
        <Toaster />
        <Component {...pageProps} />
      </UnifiedWalletProvider>
    </QueryClientProvider>
  );
}
