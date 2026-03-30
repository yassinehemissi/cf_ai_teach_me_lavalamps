import { Vector3 } from "three";

import type {
  BlobSeed,
  InternalBlobState,
  BlobMotion,
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
    motion: createInternalBlobMotion(blob.motion, simulatorConfig),
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
    motion: cloneInternalBlobMotion(blob.motion),
  }));
}

// Converts a serializable vector into a Three.js vector instance.
export function toVector3(value: Vector3Like): Vector3 {
  return new Vector3(value.x, value.y, value.z);
}

function createInternalBlobMotion(
  motion: BlobSeed["motion"],
  simulatorConfig: PhysicsSimulatorConfig,
): BlobMotion<Vector3> {
  if (!motion || motion.kind === "dynamic") {
    return { kind: "dynamic" };
  }

  const coordinateFrame = resolveCoordinateFrame(simulatorConfig.projection);
  const anchorPosition =
    simulatorConfig.projection?.inputSpace === "lamp-local"
      ? projectPointFromLampLocal(motion.anchorPosition, coordinateFrame)
      : motion.anchorPosition;
  const wobbleAmplitude =
    simulatorConfig.projection?.inputSpace === "lamp-local"
      ? projectVectorFromLampLocal(
          motion.wobbleAmplitude ?? { x: 0, y: 0, z: 0 },
          coordinateFrame,
        )
      : motion.wobbleAmplitude ?? { x: 0, y: 0, z: 0 };

  return {
    kind: "anchored",
    anchorPosition: toVector3(anchorPosition),
    wobbleAmplitude: toVector3(wobbleAmplitude),
    wobbleFrequency: motion.wobbleFrequency ?? 0,
  };
}

function cloneInternalBlobMotion(motion: BlobMotion<Vector3>): BlobMotion<Vector3> {
  if (motion.kind === "dynamic") {
    return motion;
  }

  return {
    kind: "anchored",
    anchorPosition: motion.anchorPosition.clone(),
    wobbleAmplitude: motion.wobbleAmplitude?.clone(),
    wobbleFrequency: motion.wobbleFrequency,
  };
}
