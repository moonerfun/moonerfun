import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'Explore', href: '/explore' },
    { label: 'Rewards', href: '/rewards' },
    { label: 'Create Pool', href: '/create-pool' },
    { label: 'About', href: '/about' },
  ],
  resources: [
    { label: 'GitHub', href: 'https://github.com/moonerfun', external: true },
  ],
  social: [
    { label: 'Twitter', href: 'https://twitter.com/moonerfun', external: true },
    { label: 'Telegram', href: 'https://t.me/moonerfun_portal', external: true },

  ],
};

export const Footer = () => {
  return (
    <footer className="w-full border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🌙</span>
              <span className="text-xl font-bold">
                <span className="text-neutral-100">mooner</span>
                <span className="text-primary">.fun</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-neutral-400">
              The flywheel token launchpad on Solana. Launch tokens with automatic buyback & burn mechanics.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-primary"
                  >
                    {link.label}
                    <span className="iconify ph--arrow-up-right-bold h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Community
            </h3>
            <ul className="space-y-3">
              {footerLinks.social.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-primary"
                  >
                    {link.label}
                    <span className="iconify ph--arrow-up-right-bold h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 md:flex-row">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} mooner.fun. All rights reserved.
          </p>
          <p className="text-sm text-neutral-500">
            Built on{' '}
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Solana
            </a>{' '}
            with{' '}
            <a
              href="https://meteora.ag"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Meteora
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
