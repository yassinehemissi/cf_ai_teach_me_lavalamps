"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MeshPhysicalMaterial } from "three";

import { useLampState } from "./Lamp.state";
import type { LampProps, LavaSurfaceProps } from "./Lamp.types";
import {
  DEFAULT_LAVA_COLOR_GRADIENT,
  SURFACE_UPDATE_INTERVAL_SECONDS,
  applySurfaceTransform,
  createMarchingCubes,
  disposeMarchingCubes,
  updateLavaSurfaceShader,
  updateMarchingCubesSurface,
} from "./utils";

export function Lamp({
  preparedModel,
  renderer,
  colorGradient = DEFAULT_LAVA_COLOR_GRADIENT,
}: LampProps) {
  const lampGroupRef = useRef<Group>(null);
  const {
    lampScene,
    modelOffset,
    coordinateFrame,
    initialSnapshot,
    snapshotRef,
  } = useLampState(preparedModel, renderer);

  useFrame((frameState, deltaSeconds) => {
    renderer.step({
      deltaTimeMs: deltaSeconds * 1000,
      elapsedTimeMs: frameState.clock.elapsedTime * 1000,
    });
    snapshotRef.current = renderer.getRenderSnapshot();

    if (!lampGroupRef.current) {
      return;
    }
  });

  return (
    <group ref={lampGroupRef} position={[0, 0.7, 0]}>
      <group position={[modelOffset.x, modelOffset.y, modelOffset.z]}>
        <LampLiquid
          initialSnapshot={initialSnapshot}
          snapshotRef={snapshotRef}
          colorGradient={colorGradient}
          coordinateFrame={coordinateFrame}
        />
        <primitive object={lampScene} />
      </group>
    </group>
  );
}

function LampLiquid({
  initialSnapshot,
  snapshotRef,
  colorGradient,
  coordinateFrame,
}: LavaSurfaceProps) {
  const marchingCubes = useMemo(
    () => createMarchingCubes(initialSnapshot.field.resolution.x, colorGradient),
    [colorGradient, initialSnapshot.field.resolution.x],
  );
  const surfaceUpdateAccumulatorRef = useRef(0);

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

    surfaceUpdateAccumulatorRef.current += deltaSeconds;

    if (surfaceUpdateAccumulatorRef.current >= SURFACE_UPDATE_INTERVAL_SECONDS) {
      updateMarchingCubesSurface(
        marchingCubes,
        snapshot.field,
        snapshot.dynamics,
      );
      surfaceUpdateAccumulatorRef.current = 0;
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
