import type { SimulationGuardrails } from "../../../contracts/simulation.types";
import type {
  PhysicsProjectionConfig,
  PhysicsBoundaryConfig,
  PhysicsFieldConfig,
  PhysicsSimulatorConfig,
  SimulationBounds,
} from "../PhysicsSimulator.types";
import {
  createCoordinateFrame,
  projectBoundsFromLampLocal,
  projectPointToLampLocal,
} from "../../projections/projection";
import type { CoordinateFrame } from "../../projections/Projection.types";

// Validates the minimum invariants required to build a simulator instance.
export function assertPhysicsSimulatorConfig(
  config: PhysicsSimulatorConfig,
): void {
  if (config.initialBlobs.length === 0) {
    throw new Error("PhysicsSimulator requires at least one blob.");
  }

  if (config.field.epsilon <= 0) {
    throw new Error("Field epsilon must be greater than 0.");
  }

  if (
    config.field.resolution.x < 1 ||
    config.field.resolution.y < 1 ||
    config.field.resolution.z < 1
  ) {
    throw new Error("Field resolution must be at least 1 on every axis.");
  }

  if (config.boundary.margin < 0) {
    throw new Error("Boundary margin must be greater than or equal to 0.");
  }

  if (config.time?.fixedDeltaTimeMs !== undefined) {
    if (config.time.fixedDeltaTimeMs <= 0) {
      throw new Error("Fixed delta time must be greater than 0.");
    }
  }

  if (config.time?.maxSubsteps !== undefined) {
    if (config.time.maxSubsteps < 1) {
      throw new Error("maxSubsteps must be at least 1.");
    }
  }
}

// Clones the mutable pieces of boundary config before normalization.
export function cloneBoundaryConfig(
  config: PhysicsBoundaryConfig,
): PhysicsBoundaryConfig {
  return {
    ...config,
    bounds: cloneBounds(config.bounds),
  };
}

// Clones the mutable pieces of field config before normalization.
export function cloneFieldConfig(config: PhysicsFieldConfig): PhysicsFieldConfig {
  return {
    ...config,
    bounds: cloneBounds(config.bounds),
    resolution: { ...config.resolution },
  };
}

// Creates a deep copy of a simulation bounds object.
export function cloneBounds(bounds: SimulationBounds): SimulationBounds {
  return {
    min: { ...bounds.min },
    max: { ...bounds.max },
  };
}

// Builds parameter guardrails from the initial simulator configuration.
export function createGuardrails(
  config: PhysicsSimulatorConfig,
): SimulationGuardrails {
  const defaults: SimulationGuardrails = {
    diffusion: {
      min: 0,
      max: Math.max(config.temperature.diffusionRate * 4, 1),
      defaultValue: config.temperature.diffusionRate,
    },
    buoyancy: {
      min: 0,
      max: Math.max(config.forces.buoyancyBeta * 4, 1),
      defaultValue: config.forces.buoyancyBeta,
    },
    damping: {
      min: 0,
      max: Math.max(config.forces.dragCoefficient * 4, 1),
      defaultValue: config.forces.dragCoefficient,
    },
    temperature: {
      min: 0,
      max: Math.max(config.temperature.globalHeating * 4, 1),
      defaultValue: config.temperature.globalHeating,
    },
  };

  return {
    diffusion: {
      ...defaults.diffusion,
      ...config.guardrails?.diffusion,
    },
    buoyancy: {
      ...defaults.buoyancy,
      ...config.guardrails?.buoyancy,
    },
    damping: {
      ...defaults.damping,
      ...config.guardrails?.damping,
    },
    temperature: {
      ...defaults.temperature,
      ...config.guardrails?.temperature,
    },
  };
}

// Clamps a scalar value to an inclusive range.
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Computes the number of cells needed for the current scalar field grid.
export function getFieldCellCount(config: PhysicsFieldConfig): number {
  const { x, y, z } = config.resolution;

  return x * y * z;
}

// Resolves the coordinate frame used for projection-aware normalization.
export function resolveCoordinateFrame(
  projectionConfig?: PhysicsProjectionConfig,
): CoordinateFrame {
  return projectionConfig?.coordinateFrame ?? createCoordinateFrame();
}

// Normalizes boundary bounds into simulation space when lamp-local input is used.
export function normalizeBoundaryConfig(
  config: PhysicsBoundaryConfig,
  simulatorConfig: PhysicsSimulatorConfig,
): PhysicsBoundaryConfig {
  return {
    ...cloneBoundaryConfig(config),
    bounds: normalizeBounds(config.bounds, simulatorConfig),
  };
}

// Normalizes field bounds and callbacks into simulation space when needed.
export function normalizeFieldConfig(
  config: PhysicsFieldConfig,
  simulatorConfig: PhysicsSimulatorConfig,
): PhysicsFieldConfig {
  const normalizedConfig = cloneFieldConfig(config);

  normalizedConfig.bounds = normalizeBounds(config.bounds, simulatorConfig);

  if (
    normalizedConfig.mask &&
    simulatorConfig.projection?.inputSpace === "lamp-local"
  ) {
    const coordinateFrame = resolveCoordinateFrame(simulatorConfig.projection);
    const originalMask = normalizedConfig.mask;

    normalizedConfig.mask = (point) =>
      originalMask(
        projectPointToLampLocal(point, coordinateFrame),
      );
  }

  if (
    normalizedConfig.baseContribution &&
    simulatorConfig.projection?.inputSpace === "lamp-local"
  ) {
    const coordinateFrame = resolveCoordinateFrame(simulatorConfig.projection);
    const originalBaseContribution = normalizedConfig.baseContribution;

    normalizedConfig.baseContribution = (point) =>
      originalBaseContribution(projectPointToLampLocal(point, coordinateFrame));
  }

  return normalizedConfig;
}

// Projects bounds into simulation space when the source input is lamp-local.
export function normalizeBounds(
  bounds: SimulationBounds,
  simulatorConfig: PhysicsSimulatorConfig,
): SimulationBounds {
  if (simulatorConfig.projection?.inputSpace !== "lamp-local") {
    return cloneBounds(bounds);
  }

  const coordinateFrame = resolveCoordinateFrame(simulatorConfig.projection);

  return projectBoundsFromLampLocal(bounds, coordinateFrame);
}
