"use client";

import { startTransition, useMemo, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import {
  Box3,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { LavaLampRenderer } from "@/simulation/core/LavaLampRenderer";
import type { SimulationBounds } from "@/simulation/core/PhysicsSimulator.types";

import type { OneLampState, RenderBlob } from "./OneLamp.types";

export function useOneLampState(): OneLampState {
  const [renderer] = useState(() => createRenderer());
  const [snapshot, setSnapshot] = useState(() => renderer.getRenderSnapshot());
  const gltf = useLoader(GLTFLoader, "/lava_lamp.glb");
  const model = useMemo(
    () => prepareLampModel(gltf.scene.clone(true)),
    [gltf.scene],
  );

  useFrame((frameState, deltaSeconds) => {
    renderer.step({
      deltaTimeMs: deltaSeconds * 1000,
      elapsedTimeMs: frameState.clock.elapsedTime * 1000,
    });

    startTransition(() => {
      setSnapshot(renderer.getRenderSnapshot());
    });
  });

  return {
    lampScene: model.scene,
    modelOffset: model.offset,
    renderBlobs: mapBlobsToLavaMesh(snapshot, model.lavaBounds),
    snapshot,
  };
}

function createRenderer(): LavaLampRenderer {
  const interiorBounds = LavaLampRenderer.DEFAULT_INTERIOR_BOUNDS_HINT;

  return new LavaLampRenderer(
    { x: 0, y: 0, z: 0 },
    {
      simulatorConfig: {
        initialBlobs: createInitialBlobs(interiorBounds),
        field: {
          bounds: interiorBounds,
          resolution: { x: 14, y: 20, z: 14 },
          epsilon: 0.12,
        },
        boundary: {
          bounds: interiorBounds,
          margin: 0.14,
          stiffness: 5.2,
          damping: 1.3,
        },
        temperature: {
          ambientTemperature: 0.4,
          globalHeating: 0.72,
          coolingRate: 0.28,
          diffusionRate: 0.08,
        },
        forces: {
          gravity: 1.55,
          buoyancyBeta: 0.95,
          dragCoefficient: 0.62,
        },
      },
    },
  );
}

function createInitialBlobs(bounds: SimulationBounds) {
  const centerX = (bounds.min.x + bounds.max.x) * 0.5;
  const centerZ = (bounds.min.z + bounds.max.z) * 0.5;
  const baseY = bounds.min.y + 0.18;

  return [
    {
      id: "blob-0",
      position: { x: centerX - 0.14, y: baseY, z: centerZ - 0.12 },
      velocity: { x: 0.05, y: 0.18, z: -0.03 },
      temperature: 0.92,
      influenceRadius: 0.48,
      strength: 0.55,
    },
    {
      id: "blob-1",
      position: { x: centerX + 0.18, y: baseY + 0.18, z: centerZ + 0.04 },
      velocity: { x: -0.04, y: 0.16, z: 0.02 },
      temperature: 0.88,
      influenceRadius: 0.44,
      strength: 0.52,
    },
    {
      id: "blob-2",
      position: { x: centerX, y: baseY + 0.42, z: centerZ - 0.04 },
      velocity: { x: 0.02, y: 0.14, z: 0.05 },
      temperature: 0.83,
      influenceRadius: 0.42,
      strength: 0.48,
    },
  ];
}

function prepareLampModel(scene: Group) {
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    object.castShadow = true;
    object.receiveShadow = true;

    if (object.name.includes("Glass")) {
      object.material = new MeshPhysicalMaterial({
        color: "#b6d8ff",
        transparent: true,
        opacity: 0.22,
        roughness: 0.08,
        transmission: 0.82,
        thickness: 0.48,
        ior: 1.12,
      });
      return;
    }

    if (object.name.includes("Lava")) {
      object.material = new MeshStandardMaterial({
        color: "#ff7d36",
        emissive: "#ff5c18",
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.2,
        roughness: 0.35,
        metalness: 0.02,
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

  const sceneBounds = new Box3().setFromObject(scene);
  const lavaMesh = findNamedMesh(scene, [
    LavaLampRenderer.DEFAULT_MESH_NAMES.lava,
    "Lava",
  ]);

  if (!(lavaMesh instanceof Mesh)) {
    throw new Error("Unable to locate the embedded lava mesh in the lamp GLB.");
  }

  const lavaBounds = new Box3().setFromObject(lavaMesh);
  const sceneCenter = sceneBounds.getCenter(new Vector3());

  return {
    scene,
    lavaBounds,
    offset: {
      x: -sceneCenter.x,
      y: -sceneCenter.y,
      z: -sceneCenter.z,
    },
  };
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

function mapBlobsToLavaMesh(
  snapshot: OneLampState["snapshot"],
  lavaBounds: Box3,
): RenderBlob[] {
  const sourceBounds = snapshot.constraint.interiorBoundsHint;
  const sourceSize = {
    x: sourceBounds.max.x - sourceBounds.min.x,
    y: sourceBounds.max.y - sourceBounds.min.y,
    z: sourceBounds.max.z - sourceBounds.min.z,
  };
  const targetSize = {
    x: lavaBounds.max.x - lavaBounds.min.x,
    y: lavaBounds.max.y - lavaBounds.min.y,
    z: lavaBounds.max.z - lavaBounds.min.z,
  };
  const averageScale =
    (targetSize.x / sourceSize.x +
      targetSize.y / sourceSize.y +
      targetSize.z / sourceSize.z) /
    3;

  return snapshot.blobs.map((blob) => {
    const normalized = {
      x: normalize(blob.position.x, sourceBounds.min.x, sourceBounds.max.x),
      y: normalize(blob.position.y, sourceBounds.min.y, sourceBounds.max.y),
      z: normalize(blob.position.z, sourceBounds.min.z, sourceBounds.max.z),
    };

    return {
      id: blob.id,
      position: {
        x: lerp(lavaBounds.min.x, lavaBounds.max.x, normalized.x),
        y: lerp(lavaBounds.min.y, lavaBounds.max.y, normalized.y),
        z: lerp(lavaBounds.min.z, lavaBounds.max.z, normalized.z),
      },
      radius: blob.influenceRadius * averageScale * 0.72,
    };
  });
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) {
    return 0.5;
  }

  const ratio = (value - min) / (max - min);

  return Math.min(Math.max(ratio, 0), 1);
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}
