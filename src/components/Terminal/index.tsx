import { useWallet } from '@jup-ag/wallet-adapter';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Skeleton } from '../ui/Skeleton';

export function TerminalComponent({ mint }: { mint: string }) {
  const walletContext = useWallet();
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitializedRef = useRef(false);

  const launchPlugin = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).Jupiter) return;
    if (isInitializedRef.current) return;
    
    isInitializedRef.current = true;
    (window as any).Jupiter.init({
      displayMode: 'integrated',
      integratedTargetId: 'jupiter-terminal',
      formProps: {
        initialInputMint: 'So11111111111111111111111111111111111111112',
        initialOutputMint: mint,
      },
      enableWalletPassthrough: true,
    });
  }, [mint]);

  // Check if Jupiter Plugin is loaded
  useEffect(() => {
    const checkJupiter = setInterval(() => {
      if ((window as any).Jupiter?.init) {
        setIsLoaded(true);
        clearInterval(checkJupiter);
      }
    }, 100);

    return () => clearInterval(checkJupiter);
  }, []);

  // Initialize plugin once loaded
  useEffect(() => {
    if (isLoaded) {
      launchPlugin();
    }
  }, [isLoaded, launchPlugin]);

  // Sync wallet state with Jupiter Plugin
  useEffect(() => {
    if (isLoaded && (window as any).Jupiter?.syncProps) {
      (window as any).Jupiter.syncProps({
        passthroughWalletContextState: walletContext,
      });
    }
  }, [isLoaded, walletContext]);

  return (
    <div className="flex flex-col h-full w-full">
      {!isLoaded ? (
        <div className="w-full h-[395px] ">
          <div className="flex flex-col items-center justify-start w-full h-full gap-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <span className="text-gray-400 mt-4">Loading Jupiter Plugin...</span>
          </div>
        </div>
      ) : (
        <div id="jupiter-terminal" className="w-full h-[568px]" />
      )}
    </div>
  );
}

export default TerminalComponent;
