import { Vector3 } from "three";

import type { SimulationGuardrails } from "../../contracts/simulation.types";
import type {
  CoordinateFrame,
  CoordinateSpace,
} from "../projections/Projection.types";

export type Vector3Like = {
  x: number;
  y: number;
  z: number;
};

export type SimulationBounds = {
  min: Vector3Like;
  max: Vector3Like;
};

export type DynamicBlobMotion = {
  kind: "dynamic";
};

export type AnchoredBlobMotion<TVector = Vector3Like> = {
  kind: "anchored";
  anchorPosition: TVector;
  wobbleAmplitude?: TVector;
  wobbleFrequency?: number;
};

export type BlobMotion<TVector = Vector3Like> =
  | DynamicBlobMotion
  | AnchoredBlobMotion<TVector>;

export type BlobSeed = {
  id: string;
  position: Vector3Like;
  velocity?: Vector3Like;
  temperature: number;
  influenceRadius: number;
  strength: number;
  mass?: number;
  motion?: BlobMotion;
};

export type BlobState = {
  id: string;
  position: Vector3Like;
  velocity: Vector3Like;
  temperature: number;
  influenceRadius: number;
  strength: number;
  mass: number;
  motion: BlobMotion;
};

export type InternalBlobState = Omit<BlobState, "position" | "velocity" | "motion"> & {
  position: Vector3;
  velocity: Vector3;
  motion: BlobMotion<Vector3>;
};

export type PhysicsTemperatureConfig = {
  ambientTemperature: number;
  globalHeating: number;
  coolingRate: number;
  diffusionRate: number;
  stochasticAmplitude: number;
  stochasticFrequency: number;
  bottomHeatingBias: number;
  topCoolingBias: number;
  topCoolingThreshold: number;
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
export type FieldContributionResolver = (point: Vector3Like) => number;

export type PhysicsFieldConfig = {
  bounds: SimulationBounds;
  resolution: FieldResolution;
  epsilon: number;
  mask?: FieldMaskResolver;
  baseContribution?: FieldContributionResolver;
};

export type PhysicsTimeConfig = {
  fixedDeltaTimeMs?: number;
  maxSubsteps?: number;
};

export type PhysicsProjectionConfig = {
  coordinateFrame?: CoordinateFrame;
  inputSpace?: CoordinateSpace;
};

export type PhysicsSimulatorConfig = {
  initialBlobs: BlobSeed[];
  field: PhysicsFieldConfig;
  boundary: PhysicsBoundaryConfig;
  temperature: PhysicsTemperatureConfig;
  forces: PhysicsForceConfig;
  time?: PhysicsTimeConfig;
  projection?: PhysicsProjectionConfig;
  guardrails?: Partial<SimulationGuardrails>;
  defaultBlobMass?: number;
};

export type ScalarFieldSnapshot = {
  activeIndices: Uint16Array<ArrayBufferLike>;
  bounds: SimulationBounds;
  resolution: FieldResolution;
  activeCount: number;
  minValue: number;
  maxValue: number;
  values: Float32Array;
};

export type SimulationDynamicsSnapshot = {
  averageForceMagnitude: number;
  averageTemperature: number;
  temperatureSpread: number;
  averageVerticalVelocity: number;
};
