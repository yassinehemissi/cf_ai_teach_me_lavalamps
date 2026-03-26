import { Vector3 } from "three";

import type {
  BlobSeed,
  BlobState,
  InternalBlobState,
  Vector3Like,
} from "../PhysicsSimulator.types";

export function createInternalBlobState(
  blob: BlobSeed,
  defaultBlobMass: number,
): InternalBlobState {
  return {
    id: blob.id,
    position: toVector3(blob.position),
    velocity: toVector3(blob.velocity ?? { x: 0, y: 0, z: 0 }),
    temperature: blob.temperature,
    influenceRadius: blob.influenceRadius,
    strength: blob.strength,
    mass: blob.mass ?? defaultBlobMass,
  };
}

export function cloneInternalBlobs(
  blobs: InternalBlobState[],
): InternalBlobState[] {
  return blobs.map((blob) => ({
    ...blob,
    position: blob.position.clone(),
    velocity: blob.velocity.clone(),
  }));
}

export function toBlobState(blob: InternalBlobState): BlobState {
  return {
    id: blob.id,
    position: toVector3Like(blob.position),
    velocity: toVector3Like(blob.velocity),
    temperature: blob.temperature,
    influenceRadius: blob.influenceRadius,
    strength: blob.strength,
    mass: blob.mass,
  };
}

export function toVector3(value: Vector3Like): Vector3 {
  return new Vector3(value.x, value.y, value.z);
}

export function toVector3Like(value: Vector3): Vector3Like {
  return {
    x: value.x,
    y: value.y,
    z: value.z,
  };
}
