"use client";

import type { StageCardProps } from "./StageCard.types";

export function StageCard({ lines, rank, title }: StageCardProps) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-xs font-semibold text-amber-200">
          {rank}
        </span>
        <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
          {title}
        </p>
      </div>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <p key={line} className="break-all text-sm text-stone-200">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

