"use client";

import type { SimulationParameterEntry } from "../../SimulationParameters.types";

export function SimulationParameterPanel({
  parameters,
}: {
  parameters: SimulationParameterEntry[];
}) {
  return (
    <aside className="rounded-[1.4rem] border border-stone-700/80 bg-stone-950/85 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">
        Simulation Params
      </p>
      <div className="mt-3 space-y-2 text-sm text-stone-200">
        {parameters.map((parameter) => (
          <div
            key={parameter.key}
            className="flex items-center justify-between gap-6"
          >
            <span className="capitalize text-stone-400">{parameter.key}</span>
            <span className="font-mono text-stone-100">
              {parameter.value.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 max-w-56 text-[11px] leading-5 text-stone-500">
        Motion also depends on fixed internal heating, cooling, gravity, and
        stochastic thermal forcing that are not exposed in this panel.
      </p>
    </aside>
  );
}
