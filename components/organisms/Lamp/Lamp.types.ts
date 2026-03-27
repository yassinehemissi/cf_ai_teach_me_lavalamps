import type { MutableRefObject } from "react";
import type { Group } from "three";

import type { LavaLampRenderer } from "@/simulation/core/LavaLampRenderer";
import type { LavaLampRenderSnapshot } from "@/simulation/core/LavaLampRenderer.types";
import type {
  FieldMaskResolver,
  SimulationBounds,
} from "@/simulation/core/PhysicsSimulator.types";
import type {
  CoordinateFrame,
  ProjectionAxisName,
  ProjectionVectorLike,
} from "@/simulation/core/projections/Projection.types";

export type LampProps = {
  preparedModel: PreparedLampModel;
  renderer: LavaLampRenderer;
  colorGradient?: LavaColorGradient;
};

export type LampState = {
  lampScene: Group;
  modelOffset: {
    x: number;
    y: number;
    z: number;
  };
  coordinateFrame: CoordinateFrame;
  initialSnapshot: LavaLampRenderSnapshot;
  snapshotRef: MutableRefObject<LavaLampRenderSnapshot>;
};

export type LavaSurfaceProps = {
  initialSnapshot: LavaLampRenderSnapshot;
  snapshotRef: MutableRefObject<LavaLampRenderSnapshot>;
  colorGradient: LavaColorGradient;
  coordinateFrame: CoordinateFrame;
};

export type LavaColorGradient = {
  cool: string;
  warm: string;
  hot: string;
};

export type LavaSurfaceShader = {
  uniforms: {
    uTime: { value: number };
    uFlowStrength: { value: number };
    uHeatGap: { value: number };
    uCoolTint: { value: import("three").Color };
    uWarmTint: { value: import("three").Color };
    uHotTint: { value: import("three").Color };
  };
};

export type ModelOffset = {
  x: number;
  y: number;
  z: number;
};

export type LavaSlice = {
  centerThermal: number;
  centerA: number;
  centerB: number;
  radiusA: number;
  radiusB: number;
};

export type LavaSliceMask = {
  bounds: SimulationBounds;
  thermalAxis: ProjectionAxisName;
  thermalSign: 1 | -1;
  crossAxes: [ProjectionAxisName, ProjectionAxisName];
  slices: LavaSlice[];
  mask: FieldMaskResolver;
};

export type PreparedLampModel = {
  scene: Group;
  lavaBounds: SimulationBounds;
  modelOffset: ModelOffset;
  coordinateFrame: CoordinateFrame;
  sliceMask: LavaSliceMask;
};

export type LampBlobSeed = {
  id: string;
  position: ProjectionVectorLike;
  velocity: ProjectionVectorLike;
  temperature: number;
  influenceRadius: number;
  strength: number;
  mass: number;
};
