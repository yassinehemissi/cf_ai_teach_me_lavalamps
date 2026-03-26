import { Vector3 } from "three";

import type { SimulationGuardrails } from "../../contracts/simulation.types";

export type Vector3Like = {
  x: number;
  y: number;
  z: number;
};

export type SimulationBounds = {
  min: Vector3Like;
  max: Vector3Like;
};

export type BlobSeed = {
  id: string;
  position: Vector3Like;
  velocity?: Vector3Like;
  temperature: number;
  influenceRadius: number;
  strength: number;
  mass?: number;
};

export type BlobState = {
  id: string;
  position: Vector3Like;
  velocity: Vector3Like;
  temperature: number;
  influenceRadius: number;
  strength: number;
  mass: number;
};

export type InternalBlobState = Omit<BlobState, "position" | "velocity"> & {
  position: Vector3;
  velocity: Vector3;
};

export type PhysicsTemperatureConfig = {
  ambientTemperature: number;
  globalHeating: number;
  coolingRate: number;
  diffusionRate: number;
};

export type PhysicsForceConfig = {
  gravity: number;
  buoyancyBeta: number;
  dragCoefficient: number;
};

export type PhysicsBoundaryConfig = {
  bounds: SimulationBounds;
  margin: number;
  stiffness: number;
  damping: number;
};

export type FieldResolution = {
  x: number;
  y: number;
  z: number;
};

export type FieldMaskResolver = (point: Vector3Like) => boolean;

export type PhysicsFieldConfig = {
  bounds: SimulationBounds;
  resolution: FieldResolution;
  epsilon: number;
  mask?: FieldMaskResolver;
};

export type PhysicsTimeConfig = {
  fixedDeltaTimeMs?: number;
  maxSubsteps?: number;
};

export type PhysicsSimulatorConfig = {
  initialBlobs: BlobSeed[];
  field: PhysicsFieldConfig;
  boundary: PhysicsBoundaryConfig;
  temperature: PhysicsTemperatureConfig;
  forces: PhysicsForceConfig;
  time?: PhysicsTimeConfig;
  guardrails?: Partial<SimulationGuardrails>;
  defaultBlobMass?: number;
};

export type ScalarFieldSnapshot = {
  bounds: SimulationBounds;
  resolution: FieldResolution;
  values: Float32Array;
};
