import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>mooner.fun | Flywheel Token Launchpad</title>
        <meta
          name="description"
          content="Launch tokens with built-in buyback flywheel mechanics. 100% LP locked, community-first."
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>" />
        <Script src="https://terminal.jup.ag/main-v4.js" strategy="beforeInteractive" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
