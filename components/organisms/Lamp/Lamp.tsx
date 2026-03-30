"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

import { LampLiquid } from "./components/LampLiquid/LampLiquid";
import { useLampState } from "./Lamp.state";
import type { LampProps } from "./Lamp.types";
import { DEFAULT_LAVA_COLOR_GRADIENT, SURFACE_UPDATE_INTERVAL_SECONDS } from "./utils";

export function Lamp({
  preparedModel,
  renderer,
  colorGradient = DEFAULT_LAVA_COLOR_GRADIENT,
}: LampProps) {
  const lampGroupRef = useRef<Group>(null);
  const fieldUpdateAccumulatorRef = useRef(0);
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
    fieldUpdateAccumulatorRef.current += deltaSeconds;

    const nextSnapshot = {
      ...snapshotRef.current,
      dynamics: renderer.getDynamicsSnapshot(),
    };

    if (fieldUpdateAccumulatorRef.current >= SURFACE_UPDATE_INTERVAL_SECONDS) {
      nextSnapshot.field = renderer.getFieldSnapshot();
      fieldUpdateAccumulatorRef.current -= SURFACE_UPDATE_INTERVAL_SECONDS;
    }

    snapshotRef.current = nextSnapshot;

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
