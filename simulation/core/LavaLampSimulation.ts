import type {
  SimulationControllerContract,
  SimulationParameterUpdate,
  SimulationStepInput,
} from "../contracts/simulation.types";

export type LavaLampPlacement = {
  x: number;
  y: number;
  z: number;
};

export abstract class LavaLampSimulation
  implements SimulationControllerContract
{
  readonly placement: LavaLampPlacement;

  protected constructor(placement: LavaLampPlacement) {
    this.placement = placement;
  }

  abstract reset(): void;

  abstract step(input: SimulationStepInput): void;

  abstract setParameter(update: SimulationParameterUpdate): void;
}
