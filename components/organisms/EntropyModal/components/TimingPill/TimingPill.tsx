"use client";

import type { TimingPillProps } from "./TimingPill.types";

export function TimingPill({ label, value }: TimingPillProps) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm text-amber-200">{value.toFixed(3)} ms</p>
    </div>
  );
}

