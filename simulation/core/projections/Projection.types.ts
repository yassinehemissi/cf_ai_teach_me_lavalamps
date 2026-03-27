export type CoordinateSpace = "simulation" | "lamp-local";

export type ProjectionAxisName = "x" | "y" | "z";

export type ProjectionAxis = {
  axis: ProjectionAxisName;
  sign?: 1 | -1;
};

export type CoordinateProjection = Record<ProjectionAxisName, ProjectionAxis>;

export type CoordinateFrame = {
  lampLocalToSimulation: CoordinateProjection;
  simulationToLampLocal: CoordinateProjection;
  lampLocalOrigin: ProjectionVectorLike;
  simulationOrigin: ProjectionVectorLike;
};

export type ProjectionVectorLike = {
  x: number;
  y: number;
  z: number;
};

export type ProjectionBoundsLike = {
  min: ProjectionVectorLike;
  max: ProjectionVectorLike;
};
