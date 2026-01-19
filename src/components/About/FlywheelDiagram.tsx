export const FlywheelDiagram = () => {
  return (
    <section className="py-16 md:py-24 bg-neutral-900/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-100 md:text-4xl">
            The Flywheel Mechanism
          </h2>
          <p className="mx-auto max-w-2xl text-neutral-400">
            Once tokens migrate to DAMM, the flywheel activates—a continuous cycle that creates value for the ecosystem.
          </p>
        </div>

        {/* Diagram */}
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 md:p-12">
            {/* Cycle Diagram */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Collect */}
              <div className="flex flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10">
                  <span className="iconify ph--coins-fill h-8 w-8 text-gold-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-100">Collect</h3>
                <p className="text-sm text-neutral-400">
                  Trading fees are collected from migrated pools. <span className="text-primary font-medium">80%</span> powers the flywheel, <span className="text-emerald-400 font-medium">20%</span> goes to the token creator.
                </p>
              </div>

              {/* Buyback */}
              <div className="flex flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cosmic-500/10">
                  <span className="iconify ph--arrows-clockwise-fill h-8 w-8 text-cosmic-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-100">Buyback</h3>
                <p className="text-sm text-neutral-400">
                  Collected SOL is swapped for $MOONER tokens via Jupiter at optimal market rates.
                </p>
              </div>

              {/* Burn */}
              <div className="flex flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
                  <span className="iconify ph--fire-fill h-8 w-8 text-rose-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-100">Burn</h3>
                <p className="text-sm text-neutral-400">
                  $MOONER tokens are permanently burned, reducing total supply and increasing scarcity.
                </p>
              </div>
            </div>

            {/* Connecting Arrows */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="iconify ph--arrow-right-bold h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-primary">Continuous Cycle</span>
              <span className="iconify ph--arrow-right-bold h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-neutral-400">
            The flywheel runs on scheduled intervals, automatically processing all migrated pools. 
            Every transaction is recorded on-chain for complete transparency.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FlywheelDiagram;
