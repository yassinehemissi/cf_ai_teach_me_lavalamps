import type { LavaLampPlacement } from "@/simulation/core/LavaLampSimulation";
import { LavaLampRenderer } from "@/simulation/core/LavaLampRenderer";

import type {
  LavaSliceMask,
  PreparedLampModel,
} from "../Lamp.types";

const FIELD_GRID_RESOLUTION = 24;
const INITIAL_BLOB_COUNT = 10;
const DEFAULT_RANDOM_SEED = 20260326;
const FIXED_TIMESTEP_MS = 1000 / 120;
const THERMAL_CYCLE_FREQUENCY = 0.18;
const MIN_BLOB_SPAWN_DISTANCE = 0.32;
const MAX_BLOB_SPAWN_ATTEMPTS = 18;
const CAP_BLOB_COUNT_PER_CLUSTER = 4;
const CAP_BLOB_INFLUENCE_RADIUS = 0.26;
const CAP_BLOB_MASS = 1.1;
const CAP_BOTTOM_CLUSTER_STRENGTH = 1.52;
const CAP_TOP_CLUSTER_STRENGTH = 1.4;
const CAP_BOTTOM_VISUAL_HEIGHT = 0.08;
const CAP_TOP_VISUAL_HEIGHT = 0.92;
const CAP_LATERAL_WOBBLE_RATIO = 0.08;
const CAP_VERTICAL_WOBBLE_RATIO = 0.012;
const CAP_BOTTOM_TEMPERATURE = 0.88;
const CAP_TOP_TEMPERATURE = 0.36;
const CAP_BASE_WOBBLE_FREQUENCY = 0.16;

export function createLampRenderer(
  preparedModel: PreparedLampModel,
  placement: LavaLampPlacement,
  lampSeed: number = DEFAULT_RANDOM_SEED,
): LavaLampRenderer {
  return new LavaLampRenderer(placement, {
    interiorBoundsHint: preparedModel.lavaBounds,
    simulatorConfig: {
      projection: {
        inputSpace: "lamp-local",
        coordinateFrame: preparedModel.coordinateFrame,
      },
      initialBlobs: createInitialBlobs(preparedModel.sliceMask, lampSeed),
      defaultBlobMass: 1,
      field: {
        bounds: preparedModel.lavaBounds,
        resolution: {
          x: FIELD_GRID_RESOLUTION,
          y: FIELD_GRID_RESOLUTION,
          z: FIELD_GRID_RESOLUTION,
        },
        epsilon: 0.085,
        mask: preparedModel.sliceMask.mask,
      },
      boundary: {
        bounds: preparedModel.lavaBounds,
        margin: 0.12,
        stiffness: 4.6,
        damping: 1.8,
      },
      time: {
        fixedDeltaTimeMs: FIXED_TIMESTEP_MS,
      },
      temperature: {
        ambientTemperature: 0.4,
        globalHeating: 0.28,
        coolingRate: 0.22,
        diffusionRate: 0.05,
        stochasticAmplitude: 0.34,
        stochasticFrequency: THERMAL_CYCLE_FREQUENCY,
        bottomHeatingBias: 0.82,
        topCoolingBias: 1.28,
        topCoolingThreshold: 0.46,
      },
      forces: {
        gravity: 1.2,
        buoyancyBeta: 0.98,
        dragCoefficient: 0.38,
      },
    },
  });
}

function createInitialBlobs(sliceMask: LavaSliceMask, lampSeed: number) {
  const random = createSeededRandom(lampSeed);
  const positions = [] as Array<{ x: number; y: number; z: number }>;

  return [
    ...Array.from({ length: INITIAL_BLOB_COUNT }, (_, index) => {
      const position = sampleSpawnPoint(sliceMask, random, positions);

      positions.push(position);

      return {
        id: `blob-${lampSeed}-${index}`,
        position,
        velocity: {
          x: (random() - 0.5) * 0.08,
          y: (random() - 0.5) * 0.02,
          z: (random() - 0.5) * 0.08,
        },
        temperature: 0.76 + random() * 0.24,
        influenceRadius: 0.24 + random() * 0.12,
        strength: 0.28 + random() * 0.16,
        mass: 1,
        motion: { kind: "dynamic" as const },
      };
    }),
    ...createCapBlobs(sliceMask, lampSeed, "bottom"),
    ...createCapBlobs(sliceMask, lampSeed, "top"),
  ];
}

function sampleSpawnPoint(
  sliceMask: LavaSliceMask,
  random: () => number,
  occupiedPositions: Array<{ x: number; y: number; z: number }>,
) {
  const [axisA, axisB] = sliceMask.crossAxes;
  const lowerRange =
    sliceMask.thermalSign === 1
      ? { min: 0.06, max: 0.46 }
      : { min: 0.54, max: 0.94 };
  const candidateSlices = sliceMask.slices.filter((slice) => {
    const normalizedHeight = getNormalizedCoordinate(
      slice.centerThermal,
      sliceMask.bounds.min[sliceMask.thermalAxis],
      sliceMask.bounds.max[sliceMask.thermalAxis],
    );

    return (
      normalizedHeight >= lowerRange.min &&
      normalizedHeight <= lowerRange.max &&
      slice.radiusA > 0 &&
      slice.radiusB > 0
    );
  });
  let fallbackPoint = {
    x: (sliceMask.bounds.min.x + sliceMask.bounds.max.x) * 0.5,
    y: (sliceMask.bounds.min.y + sliceMask.bounds.max.y) * 0.5,
    z: (sliceMask.bounds.min.z + sliceMask.bounds.max.z) * 0.5,
  };

  for (let attempt = 0; attempt < MAX_BLOB_SPAWN_ATTEMPTS; attempt += 1) {
    const slice =
      candidateSlices[Math.floor(random() * candidateSlices.length)] ??
      sliceMask.slices[Math.floor(sliceMask.slices.length * 0.5)];
    const radialFactor = 0.22 + Math.sqrt(random()) * 0.72;
    const angle = random() * Math.PI * 2;
    const point = {
      x: (sliceMask.bounds.min.x + sliceMask.bounds.max.x) * 0.5,
      y: (sliceMask.bounds.min.y + sliceMask.bounds.max.y) * 0.5,
      z: (sliceMask.bounds.min.z + sliceMask.bounds.max.z) * 0.5,
    };

    point[sliceMask.thermalAxis] =
      slice.centerThermal + (random() - 0.5) * getSliceThickness(sliceMask) * 1.3;
    point[axisA] = slice.centerA + Math.cos(angle) * slice.radiusA * radialFactor;
    point[axisB] = slice.centerB + Math.sin(angle) * slice.radiusB * radialFactor;

    const clampedPoint = clampPointToBounds(point, sliceMask.bounds);

    fallbackPoint = clampedPoint;

    if (isPointFarEnough(clampedPoint, occupiedPositions, MIN_BLOB_SPAWN_DISTANCE)) {
      return clampedPoint;
    }
  }

  return fallbackPoint;
}

function getNormalizedCoordinate(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0.5;
  }

  return Math.min(Math.max((value - min) / (max - min), 0), 0.999999);
}

function getSliceThickness(sliceMask: LavaSliceMask): number {
  return (
    (sliceMask.bounds.max[sliceMask.thermalAxis] -
      sliceMask.bounds.min[sliceMask.thermalAxis]) /
    sliceMask.slices.length
  );
}

function clampPointToBounds(
  point: { x: number; y: number; z: number },
  bounds: PreparedLampModel["lavaBounds"],
) {
  return {
    x: clamp(point.x, bounds.min.x, bounds.max.x),
    y: clamp(point.y, bounds.min.y, bounds.max.y),
    z: clamp(point.z, bounds.min.z, bounds.max.z),
  };
}

function isPointFarEnough(
  point: { x: number; y: number; z: number },
  occupiedPositions: Array<{ x: number; y: number; z: number }>,
  minimumDistance: number,
): boolean {
  const minimumDistanceSquared = minimumDistance * minimumDistance;

  return occupiedPositions.every((occupiedPoint) => {
    const dx = point.x - occupiedPoint.x;
    const dy = point.y - occupiedPoint.y;
    const dz = point.z - occupiedPoint.z;

    return dx * dx + dy * dy + dz * dz >= minimumDistanceSquared;
  });
}

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;

    return value / 4294967296;
  };
}

function createCapBlobs(
  sliceMask: LavaSliceMask,
  lampSeed: number,
  side: "bottom" | "top",
) {
  const [axisA, axisB] = sliceMask.crossAxes;
  const slice = findSliceNearestVisualHeight(
    sliceMask,
    side === "bottom" ? CAP_BOTTOM_VISUAL_HEIGHT : CAP_TOP_VISUAL_HEIGHT,
  );
  const baseStrength =
    side === "bottom"
      ? CAP_BOTTOM_CLUSTER_STRENGTH / CAP_BLOB_COUNT_PER_CLUSTER
      : CAP_TOP_CLUSTER_STRENGTH / CAP_BLOB_COUNT_PER_CLUSTER;
  const temperature =
    side === "bottom" ? CAP_BOTTOM_TEMPERATURE : CAP_TOP_TEMPERATURE;

  return Array.from({ length: CAP_BLOB_COUNT_PER_CLUSTER }, (_, index) => {
    const angle =
      (index / CAP_BLOB_COUNT_PER_CLUSTER) * Math.PI * 2 +
      (side === "top" ? Math.PI * 0.25 : 0);
    const radialFactor = 0.22 + (index % 2) * 0.16;
    const anchorPosition = {
      x: (sliceMask.bounds.min.x + sliceMask.bounds.max.x) * 0.5,
      y: (sliceMask.bounds.min.y + sliceMask.bounds.max.y) * 0.5,
      z: (sliceMask.bounds.min.z + sliceMask.bounds.max.z) * 0.5,
    };

    anchorPosition[sliceMask.thermalAxis] = slice.centerThermal;
    anchorPosition[axisA] =
      slice.centerA + Math.cos(angle) * slice.radiusA * radialFactor;
    anchorPosition[axisB] =
      slice.centerB + Math.sin(angle) * slice.radiusB * radialFactor;

    const clampedAnchor = clampPointToBounds(anchorPosition, sliceMask.bounds);

    return {
      id: `cap-${side}-${lampSeed}-${index}`,
      position: clampedAnchor,
      velocity: { x: 0, y: 0, z: 0 },
      temperature,
      influenceRadius: CAP_BLOB_INFLUENCE_RADIUS,
      strength: baseStrength,
      mass: CAP_BLOB_MASS,
      motion: {
        kind: "anchored" as const,
        anchorPosition: clampedAnchor,
        wobbleAmplitude: createCapWobbleAmplitude(sliceMask, slice),
        wobbleFrequency: CAP_BASE_WOBBLE_FREQUENCY + index * 0.015,
      },
    };
  });
}

function createCapWobbleAmplitude(
  sliceMask: LavaSliceMask,
  slice: LavaSliceMask["slices"][number],
) {
  const amplitude = {
    x: 0,
    y: 0,
    z: 0,
  };

  amplitude[sliceMask.thermalAxis] =
    getSliceThickness(sliceMask) * CAP_VERTICAL_WOBBLE_RATIO;
  amplitude[sliceMask.crossAxes[0]] = slice.radiusA * CAP_LATERAL_WOBBLE_RATIO;
  amplitude[sliceMask.crossAxes[1]] = slice.radiusB * CAP_LATERAL_WOBBLE_RATIO;

  return amplitude;
}

function findSliceNearestVisualHeight(
  sliceMask: LavaSliceMask,
  visualHeight: number,
) {
  const targetCoordinate = getThermalCoordinateForVisualHeight(
    sliceMask,
    visualHeight,
  );

  return sliceMask.slices.reduce((closestSlice, candidateSlice) =>
    Math.abs(candidateSlice.centerThermal - targetCoordinate) <
    Math.abs(closestSlice.centerThermal - targetCoordinate)
      ? candidateSlice
      : closestSlice,
  );
}

function getThermalCoordinateForVisualHeight(
  sliceMask: LavaSliceMask,
  visualHeight: number,
) {
  const normalizedHeight =
    sliceMask.thermalSign === 1 ? visualHeight : 1 - visualHeight;

  return (
    sliceMask.bounds.min[sliceMask.thermalAxis] +
    (sliceMask.bounds.max[sliceMask.thermalAxis] -
      sliceMask.bounds.min[sliceMask.thermalAxis]) *
      normalizedHeight
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
