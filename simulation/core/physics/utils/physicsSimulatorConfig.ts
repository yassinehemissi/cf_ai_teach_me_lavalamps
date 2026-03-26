import type { SimulationGuardrails } from "../../../contracts/simulation.types";
import type {
  PhysicsBoundaryConfig,
  PhysicsFieldConfig,
  PhysicsSimulatorConfig,
  SimulationBounds,
} from "../PhysicsSimulator.types";

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

export function cloneBoundaryConfig(
  config: PhysicsBoundaryConfig,
): PhysicsBoundaryConfig {
  return {
    ...config,
    bounds: cloneBounds(config.bounds),
  };
}

export function cloneFieldConfig(config: PhysicsFieldConfig): PhysicsFieldConfig {
  return {
    ...config,
    bounds: cloneBounds(config.bounds),
    resolution: { ...config.resolution },
  };
}

export function cloneBounds(bounds: SimulationBounds): SimulationBounds {
  return {
    min: { ...bounds.min },
    max: { ...bounds.max },
  };
}

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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getFieldCellCount(config: PhysicsFieldConfig): number {
  const { x, y, z } = config.resolution;

  return x * y * z;
}
