import { Vector3 } from "three";

import type {
  InternalBlobState,
  PhysicsFieldConfig,
} from "../PhysicsSimulator.types";

type RebuildScalarFieldArgs = {
  blobs: InternalBlobState[];
  fieldConfig: PhysicsFieldConfig;
  target: Float32Array;
};

// Rebuilds the full scalar field grid from the current blob state and base field.
export function rebuildScalarField({
  blobs,
  fieldConfig,
  target,
}: RebuildScalarFieldArgs): void {
  const { min, max } = fieldConfig.bounds;
  const { resolution } = fieldConfig;
  const stepX = getAxisStep(min.x, max.x, resolution.x);
  const stepY = getAxisStep(min.y, max.y, resolution.y);
  const stepZ = getAxisStep(min.z, max.z, resolution.z);
  const point = new Vector3();

  let index = 0;

  for (let z = 0; z < resolution.z; z += 1) {
    point.z = min.z + stepZ * z;

    for (let y = 0; y < resolution.y; y += 1) {
      point.y = min.y + stepY * y;

      for (let x = 0; x < resolution.x; x += 1) {
        point.x = min.x + stepX * x;

        if (
          fieldConfig.mask &&
          !fieldConfig.mask({
            x: point.x,
            y: point.y,
            z: point.z,
          })
        ) {
          target[index] = 0;
          index += 1;
          continue;
        }

        target[index] =
          computeScalarFieldValue(point, blobs, fieldConfig.epsilon) +
          (fieldConfig.baseContribution?.({
            x: point.x,
            y: point.y,
            z: point.z,
          }) ?? 0);
        index += 1;
      }
    }
  }
}

// Accumulates blob and base-field contributions at one scalar field sample point.
function computeScalarFieldValue(
  point: Vector3,
  blobs: InternalBlobState[],
  epsilon: number,
): number {
  let value = 0;

  for (const blob of blobs) {
    const distanceSquared = point.distanceToSquared(blob.position);
    const influenceRadiusSquared = blob.influenceRadius * blob.influenceRadius;

    if (distanceSquared > influenceRadiusSquared) {
      continue;
    }

    value += blob.strength / (distanceSquared + epsilon);
  }

  return value;
}

// Computes the per-cell spacing along one grid axis.
function getAxisStep(min: number, max: number, resolution: number): number {
  if (resolution <= 1) {
    return 0;
  }

  return (max - min) / (resolution - 1);
}
