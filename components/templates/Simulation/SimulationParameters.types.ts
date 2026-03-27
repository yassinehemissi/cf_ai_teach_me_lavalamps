import type { SimulationCommand } from "@/ai/types/command.types";
import type { SimulationParameterKey } from "@/simulation/contracts/simulation.types";

export type SimulationParameterValues = Record<SimulationParameterKey, number>;

export type SimulationParameterEntry = {
  key: SimulationParameterKey;
  value: number;
};

export type UseSimulationParameterStateResult = {
  applySimulationCommand: (
    command: Extract<SimulationCommand, { kind: "set-simulation-parameter" }>,
  ) => void;
  parameterEntries: SimulationParameterEntry[];
  parameters: SimulationParameterValues;
};
