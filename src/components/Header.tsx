import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
import Link from 'next/link';
import { Button } from './ui/button';
import { CreatePoolButton } from './CreatePoolButton';
import { useMemo, useState } from 'react';
import { shortenAddress } from '@/lib/utils';
import CopyIconSVG from '@/icons/CopyIconSVG';

const NATIVE_TOKEN_ADDRESS = 'H6Mt2u7ZRGwQb4KBHw3jbT2NazpVYLCFWjTRM2S6UX3n';

export const Header = () => {
  const { setShowModal } = useUnifiedWalletContext();
  const [copied, setCopied] = useState(false);

  const { disconnect, publicKey } = useWallet();
  const address = useMemo(() => publicKey?.toBase58(), [publicKey]);

  const handleConnectWallet = () => {
    // In a real implementation, this would connect to a Solana wallet
    setShowModal(true);
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(NATIVE_TOKEN_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <header className="w-full px-4 py-3 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          <span className="whitespace-nowrap text-lg md:text-2xl font-bold">
            <span className="text-moon-100">mooner</span>
            <span className="text-moon-400">.fun</span>
          </span>
        </Link>

        {/* Navigation and Actions */}
        <div className="flex items-center gap-4">
          <CreatePoolButton />
          {address ? (
            <Button onClick={() => disconnect()}>{shortenAddress(address)}</Button>
          ) : (
            <Button
              onClick={() => {
                handleConnectWallet();
              }}
            >
              <span className="hidden md:block">Connect Wallet</span>
              <span className="block md:hidden">Connect</span>
            </Button>
          )}
        </div>
      </header>

      {/* Native Token Bar */}
      <div className="w-full bg-gradient-to-r from-moon-400/20 via-purple-900/20 to-moon-400/20 border-y border-moon-400/30 overflow-hidden relative">
        {/* Animated stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ top: '20%', left: '10%' }} />
          <div className="absolute w-0.5 h-0.5 bg-white/30 rounded-full animate-pulse" style={{ top: '60%', left: '25%', animationDelay: '0.5s' }} />
          <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ top: '30%', left: '80%', animationDelay: '1s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white/40 rounded-full animate-pulse" style={{ top: '70%', left: '90%', animationDelay: '0.3s' }} />
          <div className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ top: '40%', left: '50%', animationDelay: '0.7s' }} />
        </div>
        
        <div className="px-4 py-2.5 flex items-center justify-center gap-2 md:gap-3 relative z-10">
          {/* Fancy animated moon icon */}
          <div className="relative">
            <span className="text-xl md:text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🌙</span>
            <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur-md animate-pulse" />
          </div>
          
          <span className="text-xs md:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-moon-100 to-yellow-200 animate-pulse" style={{ animationDuration: '3s' }}>
            ✨ Official $MOONER Token ✨
          </span>
          <button
            onClick={handleCopyToken}
            className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-lg bg-moon-400/20 hover:bg-moon-400/30 border border-moon-400/50 transition-all duration-200 group"
          >
            <span className="text-xs md:text-sm font-mono text-moon-100 hidden sm:inline">
              {NATIVE_TOKEN_ADDRESS}
            </span>
            <span className="text-xs font-mono text-moon-100 sm:hidden">
              {shortenAddress(NATIVE_TOKEN_ADDRESS)}
            </span>
            <span className="text-moon-400 group-hover:text-moon-100 transition-colors">
              {copied ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <CopyIconSVG width={16} height={16} />
              )}
            </span>
          </button>
          {copied && (
            <span className="text-xs text-green-400 animate-pulse">Copied!</span>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
