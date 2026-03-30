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
  InternalBlobState,
  PhysicsBoundaryConfig,
  PhysicsFieldConfig,
  PhysicsForceConfig,
  PhysicsSimulatorConfig,
  SimulationDynamicsSnapshot,
  PhysicsTemperatureConfig,
  ScalarFieldSnapshot,
} from "./PhysicsSimulator.types";
import {
  assertPhysicsSimulatorConfig,
  clamp,
  cloneBounds,
  createGuardrails,
  getFieldCellCount,
  normalizeBoundaryConfig,
  normalizeFieldConfig,
} from "./utils/physicsSimulatorConfig";
import { rebuildScalarField } from "./utils/physicsSimulatorField";
import {
  cloneInternalBlobs,
  createInternalBlobState,
} from "./utils/physicsSimulatorState";
import {
  advanceBlobs,
  computeBlobForceSnapshot,
} from "./utils/physicsSimulatorTimeStep";

export class PhysicsSimulator extends LavaLampSimulation {
  // Defines the default fixed simulation step used for stable integration.
  private static readonly DEFAULT_FIXED_DELTA_TIME_MS = 1000 / 120;
  // Caps the amount of catch-up work performed per external frame.
  private static readonly DEFAULT_MAX_SUBSTEPS = 8;

  private readonly boundaryConfig: PhysicsBoundaryConfig;
  private readonly baseBoundaryConfig: PhysicsBoundaryConfig;
  private readonly fieldConfig: PhysicsFieldConfig;
  private readonly baseFieldConfig: PhysicsFieldConfig;
  private readonly forceConfig: PhysicsForceConfig;
  private readonly baseForceConfig: PhysicsForceConfig;
  private readonly temperatureConfig: PhysicsTemperatureConfig;
  private readonly baseTemperatureConfig: PhysicsTemperatureConfig;
  private readonly guardrails: SimulationGuardrails;
  private readonly fixedDeltaTimeMs: number;
  private readonly maxSubsteps: number;
  private readonly initialBlobs: InternalBlobState[];
  private readonly fieldValues: Float32Array;

  private accumulatedTimeMs = 0;
  private simulationTimeSeconds = 0;
  private blobs: InternalBlobState[];
  private fieldDirty = false;
  private fieldActiveCount = 0;
  private fieldActiveIndices = new Uint16Array(0);
  private fieldMinValue = 0;
  private fieldMaxValue = 0;

  // Initializes the simulator, normalizes config, and builds the first field snapshot.
  constructor(placement: LavaLampPlacement, config: PhysicsSimulatorConfig) {
    super(placement);

    assertPhysicsSimulatorConfig(config);

    this.boundaryConfig = normalizeBoundaryConfig(config.boundary, config);
    this.baseBoundaryConfig = {
      ...this.boundaryConfig,
      bounds: cloneBounds(this.boundaryConfig.bounds),
    };
    this.fieldConfig = normalizeFieldConfig(config.field, config);
    this.baseFieldConfig = {
      ...this.fieldConfig,
      bounds: cloneBounds(this.fieldConfig.bounds),
      resolution: { ...this.fieldConfig.resolution },
    };
    this.forceConfig = { ...config.forces };
    this.baseForceConfig = { ...config.forces };
    this.temperatureConfig = { ...config.temperature };
    this.baseTemperatureConfig = { ...config.temperature };
    this.guardrails = createGuardrails(config);
    this.fixedDeltaTimeMs =
      config.time?.fixedDeltaTimeMs ??
      PhysicsSimulator.DEFAULT_FIXED_DELTA_TIME_MS;
    this.maxSubsteps =
      config.time?.maxSubsteps ?? PhysicsSimulator.DEFAULT_MAX_SUBSTEPS;
    this.initialBlobs = config.initialBlobs.map((blob) =>
      createInternalBlobState(blob, config.defaultBlobMass ?? 1, config),
    );
    this.blobs = cloneInternalBlobs(this.initialBlobs);
    this.fieldValues = new Float32Array(getFieldCellCount(this.fieldConfig));

    this.rebuildFieldSnapshot();
  }

  // Restores blobs, time accumulation, and scalar field state to the initial snapshot.
  reset(): void {
    this.accumulatedTimeMs = 0;
    this.simulationTimeSeconds = 0;
    this.blobs = cloneInternalBlobs(this.initialBlobs);
    this.rebuildFieldSnapshot();
  }

  // Advances the simulation with fixed-size internal substeps for stability.
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
        simulationTimeSeconds: this.simulationTimeSeconds,
      });
      this.simulationTimeSeconds += this.fixedDeltaTimeMs / 1000;
      this.accumulatedTimeMs -= this.fixedDeltaTimeMs;
      substeps += 1;
    }

    if (substeps > 0) {
      this.fieldDirty = true;
    }
  }

  // Applies one external parameter update while respecting configured guardrails.
  setParameter(update: SimulationParameterUpdate): void {
    const guardrail = this.guardrails[update.key];
    const clampedValue = clamp(update.value, guardrail.min, guardrail.max);
    const defaultValue = Math.max(guardrail.defaultValue, 0.0001);
    const relativeScale = clampedValue / defaultValue;

    switch (update.key) {
      case "diffusion":
        this.temperatureConfig.diffusionRate = clampedValue;
        this.fieldConfig.epsilon = clamp(
          this.baseFieldConfig.epsilon * (0.7 + relativeScale * 0.6),
          0.02,
          2,
        );
        return;
      case "buoyancy":
        this.forceConfig.buoyancyBeta = clampedValue;
        this.forceConfig.gravity = clamp(
          this.baseForceConfig.gravity * (1.18 - relativeScale * 0.18),
          0.1,
          this.baseForceConfig.gravity * 1.5,
        );
        return;
      case "damping":
        this.forceConfig.dragCoefficient = clampedValue;
        this.boundaryConfig.damping = clamp(
          this.baseBoundaryConfig.damping * relativeScale,
          0,
          this.baseBoundaryConfig.damping * 4,
        );
        return;
      case "temperature":
        this.temperatureConfig.globalHeating = clampedValue;
        this.temperatureConfig.bottomHeatingBias =
          this.baseTemperatureConfig.bottomHeatingBias * relativeScale;
        this.temperatureConfig.topCoolingBias =
          this.baseTemperatureConfig.topCoolingBias * relativeScale;
        this.temperatureConfig.stochasticAmplitude =
          this.baseTemperatureConfig.stochasticAmplitude * relativeScale;
        return;
    }
  }

  // Returns a defensive copy of the current scalar field snapshot.
  getFieldSnapshot(): ScalarFieldSnapshot {
    if (this.fieldDirty) {
      this.rebuildFieldSnapshot();
    }

    return {
      activeCount: this.fieldActiveCount,
      activeIndices: this.fieldActiveIndices,
      bounds: cloneBounds(this.fieldConfig.bounds),
      maxValue: this.fieldMaxValue,
      minValue: this.fieldMinValue,
      resolution: { ...this.fieldConfig.resolution },
      values: this.fieldValues,
    };
  }

  // Summarizes the current simulation energy/temperature state for rendering decisions.
  getDynamicsSnapshot(): SimulationDynamicsSnapshot {
    if (this.blobs.length === 0) {
      return {
        averageForceMagnitude: 0,
        averageTemperature: this.temperatureConfig.ambientTemperature,
        temperatureSpread: 0,
        averageVerticalVelocity: 0,
      };
    }

    const totalTemperature = this.blobs.reduce(
      (sum, blob) => sum + blob.temperature,
      0,
    );
    const averageTemperature = totalTemperature / this.blobs.length;
    const averageForceMagnitude =
      this.blobs.reduce(
        (sum, blob) =>
          sum +
          computeBlobForceSnapshot(
            blob,
            this.boundaryConfig,
            this.forceConfig,
            this.temperatureConfig,
          ).length(),
        0,
      ) / this.blobs.length;
    const averageVerticalVelocity =
      this.blobs.reduce((sum, blob) => sum + blob.velocity.y, 0) /
      this.blobs.length;
    const temperatureSpread =
      this.blobs.reduce(
        (sum, blob) => sum + Math.abs(blob.temperature - averageTemperature),
        0,
      ) / this.blobs.length;

    return {
      averageForceMagnitude,
      averageTemperature,
      temperatureSpread,
      averageVerticalVelocity,
    };
  }

  // Rebuilds the scalar field from the current blob state.
  private rebuildFieldSnapshot(): void {
    const stats = rebuildScalarField({
      blobs: this.blobs,
      fieldConfig: this.fieldConfig,
      target: this.fieldValues,
    });
    this.fieldActiveCount = stats.activeCount;
    this.fieldActiveIndices = stats.activeIndices;
    this.fieldMinValue = stats.minValue;
    this.fieldMaxValue = stats.maxValue;
    this.fieldDirty = false;
  }
}
