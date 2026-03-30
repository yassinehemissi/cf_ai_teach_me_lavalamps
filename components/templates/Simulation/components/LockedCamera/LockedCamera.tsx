"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import type { LockedCameraProps } from "./LockedCamera.types";

export function LockedCamera({ target, position }: LockedCameraProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, position, target]);

  return null;
}
