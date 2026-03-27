"use client";

import { useCallback, useMemo, useState } from "react";

import type { SimulationCommand } from "@/ai/types/command.types";
import type { LavaLampRenderer } from "@/simulation/core/LavaLampRenderer";
import type { SimulationParameterKey } from "@/simulation/contracts/simulation.types";

import type {
  SimulationParameterValues,
  UseSimulationParameterStateResult,
} from "./SimulationParameters.types";

const DEFAULT_PARAMETER_VALUES: SimulationParameterValues = {
  buoyancy: 0.98,
  damping: 0.38,
  diffusion: 0.05,
  temperature: 0.28,
};

export function useSimulationParameterState(
  renderers: LavaLampRenderer[],
): UseSimulationParameterStateResult {
  const [parameters, setParameters] = useState<SimulationParameterValues>(
    DEFAULT_PARAMETER_VALUES,
  );

  const parameterEntries = useMemo(
    () =>
      (Object.entries(parameters) as Array<[SimulationParameterKey, number]>).map(
        ([key, value]) => ({
          key,
          value,
        }),
      ),
    [parameters],
  );

  const applySimulationCommand = useCallback(
    (
      command: Extract<SimulationCommand, { kind: "set-simulation-parameter" }>,
    ) => {
      setParameters((currentParameters) => {
        const nextValue =
          command.mode === "absolute"
            ? command.value
            : currentParameters[command.key] + command.delta;
        const nextParameters = {
          ...currentParameters,
          [command.key]: nextValue,
        };

        renderers.forEach((renderer) => {
          renderer.setParameter({
            key: command.key,
            value: nextValue,
          });
        });

        return nextParameters;
      });
    },
    [renderers],
  );

  return {
    applySimulationCommand,
    parameterEntries,
    parameters,
  };
}
