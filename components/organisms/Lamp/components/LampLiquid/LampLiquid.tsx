"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshPhysicalMaterial } from "three";

import type { LampLiquidProps } from "./LampLiquid.types";
import {
  SURFACE_UPDATE_INTERVAL_SECONDS,
  applySurfaceTransform,
  createMarchingCubes,
  disposeMarchingCubes,
  updateLavaSurfaceShader,
  updateMarchingCubesSurface,
} from "../../utils";

export function LampLiquid({
  initialSnapshot,
  snapshotRef,
  colorGradient,
  coordinateFrame,
}: LampLiquidProps) {
  const marchingCubes = useMemo(
    () => createMarchingCubes(initialSnapshot.field.resolution.x, colorGradient),
    [colorGradient, initialSnapshot.field.resolution.x],
  );
  const lastFieldRef = useRef(initialSnapshot.field);

  useEffect(() => {
    applySurfaceTransform(
      marchingCubes,
      initialSnapshot.field,
      coordinateFrame,
    );

    return () => {
      disposeMarchingCubes(marchingCubes);
    };
  }, [coordinateFrame, initialSnapshot.field, marchingCubes]);

  useFrame((frameState, deltaSeconds) => {
    const snapshot = snapshotRef.current;

    if (lastFieldRef.current !== snapshot.field) {
      updateMarchingCubesSurface(
        marchingCubes,
        snapshot.field,
        snapshot.dynamics,
      );
      lastFieldRef.current = snapshot.field;
    }

    updateLavaSurfaceShader(
      marchingCubes.material as MeshPhysicalMaterial,
      snapshot.dynamics,
      frameState.clock.elapsedTime,
      colorGradient,
    );
  });

  return <primitive object={marchingCubes} position={[0, 0, 0]} scale={[1, 1, 1]} />;
}
