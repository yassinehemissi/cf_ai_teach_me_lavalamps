"use client";

import { useEffect } from "react";

type SimulationErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SimulationErrorPage({
  error,
  reset,
}: SimulationErrorPageProps) {
  useEffect(() => {
    console.error("Simulation route failed.", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#2f221f,_#120d0c_55%,_#080607)] px-6 text-stone-100">
      <div className="max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-red-300">
          Simulation Load Error
        </p>
        <h1 className="mt-3 font-mono text-3xl text-stone-100">
          The remote lamp model could not be loaded
        </h1>
        <p className="mt-4 text-sm leading-6 text-stone-300">
          Check that the CDN URL is reachable from the browser and that the
          asset allows cross-origin loading.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-stone-700/80 bg-stone-950/60 px-4 py-2 text-sm text-stone-100 transition hover:border-amber-400 hover:text-amber-200"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
