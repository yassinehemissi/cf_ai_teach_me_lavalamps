"use client";

import { useMemo, useRef } from "react";
import type { Group } from "three";

import type { LavaLampRenderer } from "@/simulation/core/LavaLampRenderer";

import type { LampState, PreparedLampModel } from "./Lamp.types";

export function useLampState(
  preparedModel: PreparedLampModel,
  renderer: LavaLampRenderer,
): LampState {
  const lampScene = useMemo<Group>(
    () => preparedModel.scene.clone(true),
    [preparedModel.scene],
  );
  const initialSnapshot = useMemo(() => renderer.getRenderSnapshot(), [renderer]);
  const snapshotRef = useRef(initialSnapshot);

  return {
    lampScene,
    modelOffset: preparedModel.modelOffset,
    coordinateFrame: preparedModel.coordinateFrame,
    initialSnapshot,
    snapshotRef,
  };
}
