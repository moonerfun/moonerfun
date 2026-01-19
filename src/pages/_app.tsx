import '@/styles/globals.css';
import { Adapter, UnifiedWalletProvider } from '@jup-ag/wallet-adapter';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  MathWalletAdapter,
  NightlyWalletAdapter,
  SalmonWalletAdapter,
  SkyWalletAdapter,
  TokenPocketWalletAdapter,
  AlphaWalletAdapter,
  AvanaWalletAdapter,
  BitpieWalletAdapter,
  HuobiWalletAdapter,
  SafePalWalletAdapter,
} from '@solana/wallet-adapter-wallets';
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
  // Include popular wallet adapters
  const wallets: Adapter[] = useMemo(
    (): Adapter[] => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TrustWalletAdapter(),
      new LedgerWalletAdapter(),
      new Coin98WalletAdapter(),
      new CloverWalletAdapter(),
      new MathWalletAdapter(),
      new NightlyWalletAdapter(),
      new SalmonWalletAdapter(),
      new SkyWalletAdapter(),
      new TokenPocketWalletAdapter(),
      new TorusWalletAdapter(),
      new AlphaWalletAdapter(),
      new AvanaWalletAdapter(),
      new BitpieWalletAdapter(),
      new HuobiWalletAdapter(),
      new SafePalWalletAdapter(),
    ],
    []
  );

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
          theme: 'jupiter',
          lang: 'en',
          walletlistExplanation: {
            href: 'https://station.jup.ag/docs/additional-topics/wallet-list',
          },
        }}
      >
        <Toaster />
        <Component {...pageProps} />
      </UnifiedWalletProvider>
    </QueryClientProvider>
  );
}
