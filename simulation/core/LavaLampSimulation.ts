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

  // Stores the immutable placement assigned to this lamp instance.
  protected constructor(placement: LavaLampPlacement) {
    this.placement = placement;
  }

  // Restores the simulation to its initial conditions.
  abstract reset(): void;

  // Advances the simulation by the provided timestep input.
  abstract step(input: SimulationStepInput): void;

  // Updates one exposed runtime parameter through the controller contract.
  abstract setParameter(update: SimulationParameterUpdate): void;
}
