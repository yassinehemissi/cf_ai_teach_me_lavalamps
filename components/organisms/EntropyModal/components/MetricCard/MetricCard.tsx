"use client";

import type { MetricCardProps } from "./MetricCard.types";

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-3 break-all text-lg text-stone-100">{value}</p>
    </div>
  );
}

