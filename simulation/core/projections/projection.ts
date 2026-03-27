import type {
  CoordinateFrame,
  CoordinateProjection,
  ProjectionAxisName,
  ProjectionBoundsLike,
  ProjectionVectorLike,
} from "./Projection.types";

// Creates a coordinate frame that links lamp-local space and simulation space.
export function createCoordinateFrame(
  lampLocalToSimulation: CoordinateProjection = createIdentityProjection(),
  lampLocalOrigin: ProjectionVectorLike = { x: 0, y: 0, z: 0 },
): CoordinateFrame {
  const simulationOrigin = projectVectorRaw(
    lampLocalOrigin,
    lampLocalToSimulation,
  );

  return {
    lampLocalToSimulation,
    simulationToLampLocal: invertProjection(lampLocalToSimulation),
    lampLocalOrigin,
    simulationOrigin,
  };
}

// Builds the identity axis mapping for lamps that already match simulation space.
export function createIdentityProjection(): CoordinateProjection {
  return {
    x: { axis: "x", sign: 1 },
    y: { axis: "y", sign: 1 },
    z: { axis: "z", sign: 1 },
  };
}

// Projects a lamp-local point into simulation space around the configured origins.
export function projectPointFromLampLocal(
  point: ProjectionVectorLike,
  coordinateFrame: CoordinateFrame,
): ProjectionVectorLike {
  return addVectors(
    projectVectorRaw(
      subtractVectors(point, coordinateFrame.lampLocalOrigin),
      coordinateFrame.lampLocalToSimulation,
    ),
    coordinateFrame.simulationOrigin,
  );
}

// Projects a simulation-space point back into lamp-local space around the configured origins.
export function projectPointToLampLocal(
  point: ProjectionVectorLike,
  coordinateFrame: CoordinateFrame,
): ProjectionVectorLike {
  return addVectors(
    projectVectorRaw(
      subtractVectors(point, coordinateFrame.simulationOrigin),
      coordinateFrame.simulationToLampLocal,
    ),
    coordinateFrame.lampLocalOrigin,
  );
}

// Projects a lamp-local direction vector into simulation space.
export function projectVectorFromLampLocal(
  vector: ProjectionVectorLike,
  coordinateFrame: CoordinateFrame,
): ProjectionVectorLike {
  return projectVectorRaw(vector, coordinateFrame.lampLocalToSimulation);
}

// Projects a simulation-space direction vector back into lamp-local space.
export function projectVectorToLampLocal(
  vector: ProjectionVectorLike,
  coordinateFrame: CoordinateFrame,
): ProjectionVectorLike {
  return projectVectorRaw(vector, coordinateFrame.simulationToLampLocal);
}

// Projects a lamp-local bounds box into simulation space by transforming its corners.
export function projectBoundsFromLampLocal<TBounds extends ProjectionBoundsLike>(
  bounds: TBounds,
  coordinateFrame: CoordinateFrame,
): TBounds {
  return projectBoundsWithPointMapper(bounds, (corner) =>
    projectPointFromLampLocal(corner, coordinateFrame),
  );
}

// Maps all corners of a bounds object through a point projection callback.
function projectBoundsWithPointMapper<TBounds extends ProjectionBoundsLike>(
  bounds: TBounds,
  mapPoint: (point: ProjectionVectorLike) => ProjectionVectorLike,
): TBounds {
  const corners = [
    { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
    { x: bounds.min.x, y: bounds.min.y, z: bounds.max.z },
    { x: bounds.min.x, y: bounds.max.y, z: bounds.min.z },
    { x: bounds.min.x, y: bounds.max.y, z: bounds.max.z },
    { x: bounds.max.x, y: bounds.min.y, z: bounds.min.z },
    { x: bounds.max.x, y: bounds.min.y, z: bounds.max.z },
    { x: bounds.max.x, y: bounds.max.y, z: bounds.min.z },
    { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z },
  ].map(mapPoint);

  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const zs = corners.map((corner) => corner.z);

  return {
    min: {
      x: Math.min(...xs),
      y: Math.min(...ys),
      z: Math.min(...zs),
    },
    max: {
      x: Math.max(...xs),
      y: Math.max(...ys),
      z: Math.max(...zs),
    },
  } as TBounds;
}

// Inverts an axis/sign projection so the reverse mapping stays explicit.
function invertProjection(projection: CoordinateProjection): CoordinateProjection {
  const inverse: Partial<CoordinateProjection> = {};
  const targetAxes: ProjectionAxisName[] = ["x", "y", "z"];

  for (const targetAxis of targetAxes) {
    const sourceAxis = projection[targetAxis];

    inverse[sourceAxis.axis] = {
      axis: targetAxis,
      sign: sourceAxis.sign ?? 1,
    };
  }

  return inverse as CoordinateProjection;
}

// Applies one projected axis selection and sign to a scalar component.
function projectScalar(
  value: ProjectionVectorLike,
  axis: { axis: ProjectionAxisName; sign?: 1 | -1 },
): number {
  return value[axis.axis] * (axis.sign ?? 1);
}

// Applies an axis permutation/sign projection without origin translation.
function projectVectorRaw(
  value: ProjectionVectorLike,
  projection: CoordinateProjection,
): ProjectionVectorLike {
  return {
    x: projectScalar(value, projection.x),
    y: projectScalar(value, projection.y),
    z: projectScalar(value, projection.z),
  };
}

// Subtracts two vector-like objects component-wise.
function subtractVectors(
  left: ProjectionVectorLike,
  right: ProjectionVectorLike,
): ProjectionVectorLike {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
    z: left.z - right.z,
  };
}

// Adds two vector-like objects component-wise.
function addVectors(
  left: ProjectionVectorLike,
  right: ProjectionVectorLike,
): ProjectionVectorLike {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
    z: left.z + right.z,
  };
}
