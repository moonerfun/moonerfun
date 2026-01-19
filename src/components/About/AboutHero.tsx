export const AboutHero = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      {/* Content */}
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <div className="mb-6 text-5xl">🌙</div>
        <h1 className="mb-6 text-4xl font-bold text-neutral-100 md:text-5xl">
          About{' '}
          <span className="text-primary">mooner.fun</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-400 md:text-xl">
          The next-generation token launchpad on Solana. Launch on a fair bonding curve, and once 
          your token migrates, enjoy automated buyback and burn mechanics that benefit every holder.
        </p>
      </div>
    </section>
  );
};

export default AboutHero;
