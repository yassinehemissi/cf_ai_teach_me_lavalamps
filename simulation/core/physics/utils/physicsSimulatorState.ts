import { Vector3 } from "three";

import type {
  BlobSeed,
  InternalBlobState,
  PhysicsSimulatorConfig,
  Vector3Like,
} from "../PhysicsSimulator.types";
import {
  projectPointFromLampLocal,
  projectVectorFromLampLocal,
} from "../../projections/projection";
import { resolveCoordinateFrame } from "./physicsSimulatorConfig";

// Builds the internal vector-based blob representation from a serializable seed.
export function createInternalBlobState(
  blob: BlobSeed,
  defaultBlobMass: number,
  simulatorConfig: PhysicsSimulatorConfig,
): InternalBlobState {
  const coordinateFrame = resolveCoordinateFrame(simulatorConfig.projection);
  const position =
    simulatorConfig.projection?.inputSpace === "lamp-local"
      ? projectPointFromLampLocal(blob.position, coordinateFrame)
      : blob.position;
  const velocity =
    simulatorConfig.projection?.inputSpace === "lamp-local"
      ? projectVectorFromLampLocal(
          blob.velocity ?? { x: 0, y: 0, z: 0 },
          coordinateFrame,
        )
      : blob.velocity ?? { x: 0, y: 0, z: 0 };

  return {
    id: blob.id,
    position: toVector3(position),
    velocity: toVector3(velocity),
    temperature: blob.temperature,
    influenceRadius: blob.influenceRadius,
    strength: blob.strength,
    mass: blob.mass ?? defaultBlobMass,
  };
}

// Clones blob vectors so runtime integration does not mutate initial seeds.
export function cloneInternalBlobs(
  blobs: InternalBlobState[],
): InternalBlobState[] {
  return blobs.map((blob) => ({
    ...blob,
    position: blob.position.clone(),
    velocity: blob.velocity.clone(),
  }));
}

// Converts a serializable vector into a Three.js vector instance.
export function toVector3(value: Vector3Like): Vector3 {
  return new Vector3(value.x, value.y, value.z);
}
