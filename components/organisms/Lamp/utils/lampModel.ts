import {
  Box3,
  BufferAttribute,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector3,
} from "three";

import { LavaLampRenderer } from "@/simulation/core/LavaLampRenderer";
import type {
  CoordinateFrame,
  ProjectionAxisName,
} from "@/simulation/core/projections/Projection.types";
import { createCoordinateFrame } from "@/simulation/core/projections/projection";

import type {
  LavaSliceMask,
  PreparedLampModel,
} from "../Lamp.types";

const AXES = ["x", "y", "z"] as const;
const LAVA_SLICE_COUNT = 40;
const LAMP_LOCAL_TO_SIMULATION_PROJECTION = {
  x: { axis: "x", sign: 1 },
  y: { axis: "z", sign: -1 },
  z: { axis: "y", sign: 1 },
} as const;

export function prepareLampModel(scene: Group): PreparedLampModel {
  scene.updateWorldMatrix(true, true);

  const sceneBounds = new Box3().setFromObject(scene);
  const lavaMesh = findNamedMesh(scene, [
    LavaLampRenderer.DEFAULT_MESH_NAMES.lava,
    "Lava",
  ]);

  if (!(lavaMesh instanceof Mesh)) {
    throw new Error("Unable to locate the embedded lava mesh in the lamp GLB.");
  }

  const lavaBoundsBox = new Box3().setFromObject(lavaMesh);
  const sceneCenter = sceneBounds.getCenter(new Vector3());
  const lavaCenter = lavaBoundsBox.getCenter(new Vector3());
  const coordinateFrame = createCoordinateFrame(
    LAMP_LOCAL_TO_SIMULATION_PROJECTION,
    {
      x: lavaCenter.x,
      y: lavaCenter.y,
      z: lavaCenter.z,
    },
  );
  const sliceMask = createLavaSliceMask(
    lavaMesh,
    {
      min: {
        x: lavaBoundsBox.min.x,
        y: lavaBoundsBox.min.y,
        z: lavaBoundsBox.min.z,
      },
      max: {
        x: lavaBoundsBox.max.x,
        y: lavaBoundsBox.max.y,
        z: lavaBoundsBox.max.z,
      },
    },
    coordinateFrame,
  );

  scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    object.castShadow = true;
    object.receiveShadow = true;

    if (object.name.includes("Glass")) {
      object.visible = true;
      object.material = new MeshPhysicalMaterial({
        color: "#8db8e8",
        transparent: true,
        opacity: 0.28,
        roughness: 0.14,
        transmission: 0.56,
        thickness: 0.52,
        ior: 1.18,
      });
      return;
    }

    if (object.name.includes("Lava")) {
      object.material = new MeshStandardMaterial({
        color: "#ff7d36",
        emissive: "#ff5c18",
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
        roughness: 0.35,
        metalness: 0.02,
        depthWrite: false,
      });
      return;
    }

    object.material = new MeshStandardMaterial({
      color: "#342320",
      emissive: "#180d0b",
      emissiveIntensity: 0.4,
      roughness: 0.68,
      metalness: 0.12,
    });
  });

  return {
    scene,
    lavaBounds: sliceMask.bounds,
    modelOffset: {
      x: -sceneCenter.x,
      y: -sceneCenter.y,
      z: -sceneCenter.z,
    },
    coordinateFrame,
    sliceMask,
  };
}

function createLavaSliceMask(
  lavaMesh: Mesh,
  bounds: PreparedLampModel["lavaBounds"],
  coordinateFrame: CoordinateFrame,
): LavaSliceMask {
  const thermalAxis = coordinateFrame.lampLocalToSimulation.y.axis;
  const thermalSign = coordinateFrame.lampLocalToSimulation.y.sign ?? 1;
  const crossAxes = AXES.filter(
    (axis) => axis !== thermalAxis,
  ) as [ProjectionAxisName, ProjectionAxisName];
  const [axisA, axisB] = crossAxes;
  const slices = Array.from({ length: LAVA_SLICE_COUNT }, (_, index) => ({
    minA: Number.POSITIVE_INFINITY,
    maxA: Number.NEGATIVE_INFINITY,
    minB: Number.POSITIVE_INFINITY,
    maxB: Number.NEGATIVE_INFINITY,
    centerThermal:
      bounds.min[thermalAxis] +
      ((index + 0.5) / LAVA_SLICE_COUNT) *
        (bounds.max[thermalAxis] - bounds.min[thermalAxis]),
    hasData: false,
  }));
  const positionAttribute = lavaMesh.geometry.getAttribute("position");

  if (!(positionAttribute instanceof BufferAttribute)) {
    throw new Error("Lava mesh is missing position data.");
  }

  lavaMesh.updateWorldMatrix(true, false);

  const vertex = new Vector3();

  for (let index = 0; index < positionAttribute.count; index += 1) {
    vertex
      .fromBufferAttribute(positionAttribute, index)
      .applyMatrix4(lavaMesh.matrixWorld);

    const sliceIndex = getSliceIndex(
      vertex[thermalAxis],
      bounds.min[thermalAxis],
      bounds.max[thermalAxis],
      LAVA_SLICE_COUNT,
    );
    const slice = slices[sliceIndex];

    slice.minA = Math.min(slice.minA, vertex[axisA]);
    slice.maxA = Math.max(slice.maxA, vertex[axisA]);
    slice.minB = Math.min(slice.minB, vertex[axisB]);
    slice.maxB = Math.max(slice.maxB, vertex[axisB]);
    slice.hasData = true;
  }

  fillEmptySlices(slices, bounds, axisA, axisB);

  const paddingA = (bounds.max[axisA] - bounds.min[axisA]) * 0.025;
  const paddingB = (bounds.max[axisB] - bounds.min[axisB]) * 0.025;
  const smoothedSlices = slices.map((slice, index) => {
    const window = [
      slices[Math.max(index - 1, 0)],
      slice,
      slices[Math.min(index + 1, slices.length - 1)],
    ];
    const minA = Math.min(...window.map((entry) => entry.minA)) - paddingA;
    const maxA = Math.max(...window.map((entry) => entry.maxA)) + paddingA;
    const minB = Math.min(...window.map((entry) => entry.minB)) - paddingB;
    const maxB = Math.max(...window.map((entry) => entry.maxB)) + paddingB;

    return {
      centerThermal: slice.centerThermal,
      centerA: (minA + maxA) * 0.5,
      centerB: (minB + maxB) * 0.5,
      radiusA: Math.max((maxA - minA) * 0.5, paddingA),
      radiusB: Math.max((maxB - minB) * 0.5, paddingB),
    };
  });

  return {
    bounds,
    thermalAxis,
    thermalSign,
    crossAxes,
    slices: smoothedSlices,
    mask: (point) => {
      if (!isPointInsideBounds(point, bounds)) {
        return false;
      }

      const slice =
        smoothedSlices[
          getSliceIndex(
            point[thermalAxis],
            bounds.min[thermalAxis],
            bounds.max[thermalAxis],
            smoothedSlices.length,
          )
        ];
      const normalizedA = (point[axisA] - slice.centerA) / slice.radiusA;
      const normalizedB = (point[axisB] - slice.centerB) / slice.radiusB;

      return normalizedA * normalizedA + normalizedB * normalizedB <= 1;
    },
  };
}

function fillEmptySlices(
  slices: Array<{
    minA: number;
    maxA: number;
    minB: number;
    maxB: number;
    hasData: boolean;
  }>,
  bounds: PreparedLampModel["lavaBounds"],
  axisA: ProjectionAxisName,
  axisB: ProjectionAxisName,
): void {
  const fallback = {
    minA: bounds.min[axisA],
    maxA: bounds.max[axisA],
    minB: bounds.min[axisB],
    maxB: bounds.max[axisB],
  };

  for (let index = 0; index < slices.length; index += 1) {
    if (slices[index].hasData) {
      continue;
    }

    const previous = findNeighborSlice(slices, index, -1);
    const next = findNeighborSlice(slices, index, 1);
    const source = previous ?? next ?? fallback;

    slices[index].minA = source.minA;
    slices[index].maxA = source.maxA;
    slices[index].minB = source.minB;
    slices[index].maxB = source.maxB;
    slices[index].hasData = true;
  }
}

function findNeighborSlice(
  slices: Array<{
    minA: number;
    maxA: number;
    minB: number;
    maxB: number;
    hasData: boolean;
  }>,
  startIndex: number,
  direction: -1 | 1,
) {
  let index = startIndex + direction;

  while (index >= 0 && index < slices.length) {
    if (slices[index].hasData) {
      return slices[index];
    }

    index += direction;
  }

  return undefined;
}

function getSliceIndex(
  value: number,
  min: number,
  max: number,
  sliceCount: number,
): number {
  if (sliceCount <= 1 || max <= min) {
    return 0;
  }

  const normalized = getNormalizedCoordinate(value, min, max);

  return Math.min(sliceCount - 1, Math.floor(normalized * sliceCount));
}

function getNormalizedCoordinate(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0.5;
  }

  return Math.min(Math.max((value - min) / (max - min), 0), 0.999999);
}

function isPointInsideBounds(
  point: { x: number; y: number; z: number },
  bounds: PreparedLampModel["lavaBounds"],
): boolean {
  return (
    point.x >= bounds.min.x &&
    point.x <= bounds.max.x &&
    point.y >= bounds.min.y &&
    point.y <= bounds.max.y &&
    point.z >= bounds.min.z &&
    point.z <= bounds.max.z
  );
}

function findNamedMesh(scene: Group, candidateNames: string[]): Mesh | undefined {
  for (const candidateName of candidateNames) {
    const exactMatch = scene.getObjectByName(candidateName);

    if (exactMatch instanceof Mesh) {
      return exactMatch;
    }
  }

  let partialMatch: Mesh | undefined;

  scene.traverse((object) => {
    if (partialMatch || !(object instanceof Mesh)) {
      return;
    }

    const normalizedName = object.name.toLowerCase();

    if (
      candidateNames.some((candidate) =>
        normalizedName.includes(candidate.toLowerCase()),
      )
    ) {
      partialMatch = object;
    }
  });

  return partialMatch;
}
