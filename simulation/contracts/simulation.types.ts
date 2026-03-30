export type SimulationParameterKey =
  | "diffusion"
  | "buoyancy"
  | "damping"
  | "temperature";

export type FractionGuardrail = {
  min: number;
  max: number;
  defaultValue: number;
};

export type SimulationGuardrails = Record<
  SimulationParameterKey,
  FractionGuardrail
>;

export type SimulationParameterUpdate = {
  key: SimulationParameterKey;
  value: number;
};

export type SimulationStepInput = {
  deltaTimeMs: number;
};

export interface SimulationControllerContract {
  reset(): void;
  step(input: SimulationStepInput): void;
  setParameter(update: SimulationParameterUpdate): void;
}
