import { TokenPageMsgHandler } from '@/components/Token/TokenPageMsgHandler';
import { TokenChart } from '@/components/TokenChart/TokenChart';
import { TokenDetails } from '@/components/TokenHeader/TokenDetail';
import { TokenHeader } from '@/components/TokenHeader/TokenHeader';
import { TokenStats } from '@/components/TokenHeader/TokenStats';
import { TokenBottomPanel } from '@/components/TokenTable';
import Page from '@/components/ui/Page/Page';
import { DataStreamProvider, useDataStream } from '@/contexts/DataStreamProvider';
import { TokenChartProvider } from '@/contexts/TokenChartProvider';
import { useTokenAddress, useTokenInfo } from '@/hooks/queries';
import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';

const DirectSwap = dynamic(() => import('@/components/DirectSwap'), { ssr: false });

type SwapTab = 'direct' | 'jupiter';

const DirectSwapWidget = () => {
  const tokenId = useTokenAddress();

  if (!tokenId) {
    return null;
  }

  return <DirectSwap mint={tokenId} />;
};

const JupiterTerminalWidget = () => {
  const tokenId = useTokenAddress();
  const walletContext = useWallet();
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializingRef = useRef(false);

  const initJupiter = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).Jupiter) {
      return;
    }

    if (isInitializingRef.current) {
      return;
    }
    isInitializingRef.current = true;

    // Clean up previous instance
    const container = document.getElementById('jupiter-terminal');
    if (container) {
      container.innerHTML = '';
    }

    // Jupiter Plugin v1 is RPC-less - no need to pass endpoint
    (window as any).Jupiter.init({
      displayMode: 'integrated',
      integratedTargetId: 'jupiter-terminal',
      formProps: {
        initialInputMint: 'So11111111111111111111111111111111111111112',
        initialOutputMint: tokenId || undefined,
        fixedOutputMint: !!tokenId,
      },
      enableWalletPassthrough: true,
    });
    setIsInitialized(true);
  }, [tokenId]);

  useEffect(() => {
    // Wait for Jupiter to load
    const checkJupiter = setInterval(() => {
      if ((window as any).Jupiter?.init) {
        clearInterval(checkJupiter);
        initJupiter();
      }
    }, 100);

    return () => clearInterval(checkJupiter);
  }, [initJupiter]);

  // Sync wallet state with Jupiter Plugin
  useEffect(() => {
    if (isInitialized && (window as any).Jupiter?.syncProps) {
      (window as any).Jupiter.syncProps({
        passthroughWalletContextState: walletContext,
      });
    }
  }, [isInitialized, walletContext]);

  return (
    <div 
      id="jupiter-terminal" 
      className="min-h-[400px] w-full"
      style={{ minHeight: '400px' }}
    />
  );
};

const SwapWidget = () => {
  const [activeTab, setActiveTab] = useState<SwapTab>('jupiter');

  return (
    <div className="rounded-xl border border-moon-800 bg-moon-900/50 overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-moon-700">
        <button
          onClick={() => setActiveTab('jupiter')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'jupiter'
              ? 'bg-moon-800/50 text-white border-b-2 border-cosmic-500'
              : 'text-moon-400 hover:text-white hover:bg-moon-800/30'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>⚡</span>
            Jupiter
          </span>
        </button>
        <button
          onClick={() => setActiveTab('direct')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'direct'
              ? 'bg-moon-800/50 text-white border-b-2 border-cosmic-500'
              : 'text-moon-400 hover:text-white hover:bg-moon-800/30'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>🌙</span>
            Direct Swap
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {activeTab === 'jupiter' ? (
          <JupiterTerminalWidget />
        ) : (
          <DirectSwapWidget />
        )}
      </div>
    </div>
  );
};

export const TokenPageWithContext = () => {
  const tokenId = useTokenAddress();
  const { data: poolId } = useTokenInfo((data) => data?.id);
  const { subscribeTxns, unsubscribeTxns, subscribePools, unsubscribePools } = useDataStream();

  // Subscribe to token txns
  useEffect(() => {
    if (!tokenId) {
      return undefined;
    }
    subscribeTxns([tokenId]);
    return () => {
      unsubscribeTxns([tokenId]);
    };
  }, [tokenId, subscribeTxns, unsubscribeTxns]);

  useEffect(() => {
    if (!poolId) {
      return undefined;
    }

    subscribePools([poolId]);
    return () => {
      unsubscribePools([poolId]);
    };
    // dont track tokenId to prevent data mismatch
  }, [poolId, subscribePools, unsubscribePools]);

  return (
    <Page>
      <TokenPageMsgHandler />

      <div className="flex flex-col gap-4 pb-8">
        {/* Token Header Card */}
        <div className="rounded-xl border border-moon-800 bg-moon-900/50 p-4">
          <TokenHeader className="max-sm:order-1" />
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Sidebar - Token Details & Swap */}
          <div className="flex flex-col gap-4 lg:w-[400px] lg:shrink-0 max-lg:order-2">
            <TokenDetails />
            {/* Swap Widget with Tabs */}
            <SwapWidget />
          </div>

          {/* Right Content - Chart & Tables */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 max-lg:order-1">
            {/* Stats Bar */}
            <TokenStats key={`token-stats-${poolId}`} />

            {/* Chart */}
            <div className="h-[400px] lg:h-[500px] rounded-xl border border-moon-800 bg-moon-900/30 overflow-hidden">
              <TokenChartProvider>
                <TokenChart />
              </TokenChartProvider>
            </div>

            {/* Transactions/Holders Panel */}
            <div className="h-[500px] rounded-xl border border-moon-800 bg-moon-900/30 overflow-hidden">
              <TokenBottomPanel className="flex flex-col h-full" />
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default function TokenPage() {
  return (
    <DataStreamProvider>
      <TokenPageWithContext />
    </DataStreamProvider>
  );
}
