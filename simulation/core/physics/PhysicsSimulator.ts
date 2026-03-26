import type {
  SimulationGuardrails,
  SimulationParameterUpdate,
  SimulationStepInput,
} from "../../contracts/simulation.types";
import {
  LavaLampSimulation,
  type LavaLampPlacement,
} from "../LavaLampSimulation";
import type {
  BlobState,
  InternalBlobState,
  PhysicsBoundaryConfig,
  PhysicsFieldConfig,
  PhysicsForceConfig,
  PhysicsSimulatorConfig,
  PhysicsTemperatureConfig,
  ScalarFieldSnapshot,
} from "./PhysicsSimulator.types";
import {
  assertPhysicsSimulatorConfig,
  clamp,
  cloneBounds,
  cloneBoundaryConfig,
  cloneFieldConfig,
  createGuardrails,
  getFieldCellCount,
} from "./utils/physicsSimulatorConfig";
import { rebuildScalarField } from "./utils/physicsSimulatorField";
import {
  cloneInternalBlobs,
  createInternalBlobState,
  toBlobState,
} from "./utils/physicsSimulatorState";
import { advanceBlobs } from "./utils/physicsSimulatorTimeStep";

export class PhysicsSimulator extends LavaLampSimulation {
  private static readonly DEFAULT_FIXED_DELTA_TIME_MS = 1000 / 120;
  private static readonly DEFAULT_MAX_SUBSTEPS = 8;

  private readonly boundaryConfig: PhysicsBoundaryConfig;
  private readonly fieldConfig: PhysicsFieldConfig;
  private readonly forceConfig: PhysicsForceConfig;
  private readonly temperatureConfig: PhysicsTemperatureConfig;
  private readonly guardrails: SimulationGuardrails;
  private readonly fixedDeltaTimeMs: number;
  private readonly maxSubsteps: number;
  private readonly initialBlobs: InternalBlobState[];
  private readonly fieldValues: Float32Array;

  private accumulatedTimeMs = 0;
  private blobs: InternalBlobState[];

  constructor(placement: LavaLampPlacement, config: PhysicsSimulatorConfig) {
    super(placement);

    assertPhysicsSimulatorConfig(config);

    this.boundaryConfig = cloneBoundaryConfig(config.boundary);
    this.fieldConfig = cloneFieldConfig(config.field);
    this.forceConfig = { ...config.forces };
    this.temperatureConfig = { ...config.temperature };
    this.guardrails = createGuardrails(config);
    this.fixedDeltaTimeMs =
      config.time?.fixedDeltaTimeMs ??
      PhysicsSimulator.DEFAULT_FIXED_DELTA_TIME_MS;
    this.maxSubsteps =
      config.time?.maxSubsteps ?? PhysicsSimulator.DEFAULT_MAX_SUBSTEPS;
    this.initialBlobs = config.initialBlobs.map((blob) =>
      createInternalBlobState(blob, config.defaultBlobMass ?? 1),
    );
    this.blobs = cloneInternalBlobs(this.initialBlobs);
    this.fieldValues = new Float32Array(getFieldCellCount(this.fieldConfig));

    this.rebuildFieldSnapshot();
  }

  reset(): void {
    this.accumulatedTimeMs = 0;
    this.blobs = cloneInternalBlobs(this.initialBlobs);
    this.rebuildFieldSnapshot();
  }

  step(input: SimulationStepInput): void {
    if (!Number.isFinite(input.deltaTimeMs) || input.deltaTimeMs <= 0) {
      return;
    }

    const maxAccumulatedTimeMs = this.fixedDeltaTimeMs * this.maxSubsteps;

    this.accumulatedTimeMs = Math.min(
      this.accumulatedTimeMs + input.deltaTimeMs,
      maxAccumulatedTimeMs,
    );

    let substeps = 0;

    while (
      this.accumulatedTimeMs >= this.fixedDeltaTimeMs &&
      substeps < this.maxSubsteps
    ) {
      advanceBlobs({
        blobs: this.blobs,
        boundaryConfig: this.boundaryConfig,
        forceConfig: this.forceConfig,
        temperatureConfig: this.temperatureConfig,
        deltaTimeSeconds: this.fixedDeltaTimeMs / 1000,
      });
      this.accumulatedTimeMs -= this.fixedDeltaTimeMs;
      substeps += 1;
    }

    if (substeps > 0) {
      this.rebuildFieldSnapshot();
    }
  }

  setParameter(update: SimulationParameterUpdate): void {
    const guardrail = this.guardrails[update.key];
    const clampedValue = clamp(update.value, guardrail.min, guardrail.max);

    switch (update.key) {
      case "diffusion":
        this.temperatureConfig.diffusionRate = clampedValue;
        return;
      case "buoyancy":
        this.forceConfig.buoyancyBeta = clampedValue;
        return;
      case "damping":
        this.forceConfig.dragCoefficient = clampedValue;
        return;
      case "temperature":
        this.temperatureConfig.globalHeating = clampedValue;
        return;
    }
  }

  getBlobStates(): BlobState[] {
    return this.blobs.map((blob) => toBlobState(blob));
  }

  getFieldSnapshot(): ScalarFieldSnapshot {
    return {
      bounds: cloneBounds(this.fieldConfig.bounds),
      resolution: { ...this.fieldConfig.resolution },
      values: this.fieldValues.slice(),
    };
  }

  getFixedDeltaTimeMs(): number {
    return this.fixedDeltaTimeMs;
  }

  private rebuildFieldSnapshot(): void {
    rebuildScalarField({
      blobs: this.blobs,
      fieldConfig: this.fieldConfig,
      target: this.fieldValues,
    });
  }
}
