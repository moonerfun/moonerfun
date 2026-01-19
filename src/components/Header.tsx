import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
import Link from 'next/link';
import { Button } from './ui/button';
import { CreatePoolButton } from './CreatePoolButton';
import { useMemo, useState } from 'react';
import { shortenAddress, cn } from '@/lib/utils';
import CopyIconSVG from '@/icons/CopyIconSVG';

const NATIVE_TOKEN_ADDRESS = 'H6Mt2u7ZRGwQb4KBHw3jbT2NazpVYLCFWjTRM2S6UX3n';

const navLinks = [
  { label: 'Explore', href: '/explore' },
  { label: 'Rewards', href: '/rewards' },
  { label: 'About', href: '/about' },
];

export const Header = () => {
  const { setShowModal } = useUnifiedWalletContext();
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <span className="text-neutral-100">mooner</span>
            <span className="text-primary">.fun</span>
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-400 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Navigation and Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-primary hover:border-neutral-700 transition-colors"
            aria-label="Toggle menu"
          >
            <span className={cn('iconify h-5 w-5', mobileMenuOpen ? 'ph--x-bold' : 'ph--list-bold')} />
          </button>
          
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

      {/* Mobile Menu */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 border-b border-neutral-800 bg-neutral-950',
          mobileMenuOpen ? 'max-h-48' : 'max-h-0 border-b-0'
        )}
      >
        <nav className="flex flex-col px-4 py-3 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-300 hover:text-primary hover:bg-neutral-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Native Token Bar */}
      <div className="w-full bg-primary/10 border-y border-primary/20 overflow-hidden">
        <div className="px-4 py-2.5 flex items-center justify-center gap-2 md:gap-3">
          <span className="text-xl md:text-2xl">🌙</span>
          
          <span className="text-xs md:text-sm font-bold text-primary">
            ✨ Official $MOONER Token ✨
          </span>
          <button
            onClick={handleCopyToken}
            className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 transition-all duration-200 group"
          >
            <span className="text-xs md:text-sm font-mono text-neutral-200 hidden sm:inline">
              {NATIVE_TOKEN_ADDRESS}
            </span>
            <span className="text-xs font-mono text-neutral-200 sm:hidden">
              {shortenAddress(NATIVE_TOKEN_ADDRESS)}
            </span>
            <span className="text-primary group-hover:text-primary-300 transition-colors">
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
