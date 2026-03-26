import type {
  BlobState,
  PhysicsSimulatorConfig,
  ScalarFieldSnapshot,
  SimulationBounds,
} from "./PhysicsSimulator.types";
import type { LavaLampPlacement } from "./LavaLampSimulation";

export type LavaLampModelMeshNames = {
  body: string;
  glass: string;
  lava: string;
};

export type LavaLampConstraintStrategy =
  | "lava-bounds-mask"
  | "lava-mesh-occupancy-mask";

export type LavaLampConstraintDescriptor = {
  feasible: boolean;
  strategy: LavaLampConstraintStrategy;
  interiorBoundsHint: SimulationBounds;
  notes: string[];
};

export type LavaLampRendererConfig = {
  simulatorConfig: PhysicsSimulatorConfig;
  modelAssetPath?: string;
  meshNames?: Partial<LavaLampModelMeshNames>;
  constraintStrategy?: LavaLampConstraintStrategy;
  interiorBoundsHint?: SimulationBounds;
};

export type LavaLampRenderSnapshot = {
  placement: LavaLampPlacement;
  modelAssetPath: string;
  meshNames: LavaLampModelMeshNames;
  blobs: BlobState[];
  field: ScalarFieldSnapshot;
  constraint: LavaLampConstraintDescriptor;
};
