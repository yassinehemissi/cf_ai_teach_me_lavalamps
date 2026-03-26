"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import { useOneLampState } from "./OneLamp.state";
import type { OneLampProps } from "./OneLamp.types";

export function OneLamp({ autoSpin = true }: OneLampProps) {
  const lampGroupRef = useRef<Group>(null);
  const { lampScene, modelOffset, renderBlobs } = useOneLampState();

  useFrame((_, deltaSeconds) => {
    if (!autoSpin || !lampGroupRef.current) {
      return;
    }

    lampGroupRef.current.rotation.y += deltaSeconds * 0.28;
  });

  return (
    <group ref={lampGroupRef} position={[0, -0.35, 0]}>
      <group position={[modelOffset.x, modelOffset.y, modelOffset.z]}>
        <primitive object={lampScene} />

        {renderBlobs.map((blob) => (
        <mesh
          key={blob.id}
          position={[blob.position.x, blob.position.y, blob.position.z]}
        >
          <sphereGeometry args={[blob.radius, 30, 30]} />
          <meshStandardMaterial
            color="#ff7e2f"
            emissive="#ff5b1f"
            emissiveIntensity={1.8}
            roughness={0.2}
            transparent
            opacity={0.72}
          />
        </mesh>
        ))}
      </group>
    </group>
  );
}
