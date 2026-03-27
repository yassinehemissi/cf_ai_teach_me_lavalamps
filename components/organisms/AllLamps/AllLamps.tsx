"use client";

import { Lamp } from "@/components/organisms/Lamp/Lamp";

import type { AllLampsProps } from "./AllLamps.types";

export function AllLamps({ preparedModel, lamps, boards }: AllLampsProps) {
  return (
    <>
      {boards.map((board, index) => (
        <mesh
          key={`board-${index}`}
          position={[board.position.x, board.position.y, board.position.z]}
          scale={[board.scale.x, board.scale.y, board.scale.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#6b452d" roughness={0.82} metalness={0.04} />
        </mesh>
      ))}
      {lamps.map((lamp) => (
        <group
          key={lamp.lampId}
          position={[lamp.position.x, lamp.position.y, lamp.position.z]}
        >
          <Lamp preparedModel={preparedModel} renderer={lamp.renderer} />
        </group>
      ))}
    </>
  );
}
