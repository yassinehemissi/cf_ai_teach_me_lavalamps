"use client";

export function SimulationLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#2f221f,_#120d0c_55%,_#080607)] px-6 text-stone-100">
      <div className="max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
          Loading Simulation
        </p>
        <h1 className="mt-3 font-mono text-3xl text-stone-100">
          Preparing the lamp wall
        </h1>
        <p className="mt-4 text-sm leading-6 text-stone-300">
          The room, lamp models, and simulation instances are loading on the
          client.
        </p>
        <div className="mx-auto mt-8 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-stone-800/80">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-amber-300" />
        </div>
      </div>
    </div>
  );
}
