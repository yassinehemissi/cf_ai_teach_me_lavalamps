import type { SimulationParameterKey } from "@/simulation/contracts/simulation.types";

export type SimulationCommand =
  | {
      kind: "set-simulation-parameter";
      mode: "absolute";
      key: SimulationParameterKey;
      value: number;
    }
  | {
      kind: "set-simulation-parameter";
      mode: "relative";
      key: SimulationParameterKey;
      delta: number;
    }
  | {
      kind: "run-entropy-capture";
      frameCount: number;
    };
