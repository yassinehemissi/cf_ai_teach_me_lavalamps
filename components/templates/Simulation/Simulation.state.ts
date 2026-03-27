"use client";

import { useMemo } from "react";

import { useAllLampsState } from "@/components/organisms/AllLamps/AllLamps.state";
import { useRoomState } from "@/components/organisms/Room/Room.state";

import type { SimulationState } from "./Simulation.types";

const CAMERA_VERTICAL_LIFT = 0.8;

export function useSimulationState(): SimulationState {
  const room = useRoomState();
  const allLamps = useAllLampsState({ wallMount: room.wallMount });

  return useMemo(() => {
    const boardCenter = allLamps.boards.reduce(
      (accumulator, board) => {
        accumulator.x += board.position.x;
        accumulator.y += board.position.y;
        accumulator.z += board.position.z;
        return accumulator;
      },
      { x: 0, y: 0, z: 0 },
    );
    const boardCount = Math.max(allLamps.boards.length, 1);
    const centerX = boardCenter.x / boardCount;
    const centerY = boardCenter.y / boardCount;
    const centerZ = boardCenter.z / boardCount;
    const boardSpan = allLamps.boards.reduce(
      (maximum, board) =>
        Math.max(maximum, board.scale.x, board.scale.y, board.scale.z),
      0,
    );
    const cameraDistance = Math.max(boardSpan * 0.85, 10);
    const target: [number, number, number] =
      room.wallMount.axis === "z"
        ? [
            centerX,
            centerY - 0.35,
            centerZ,
          ]
        : [
            centerX,
            centerY - 0.35,
            centerZ,
          ];
    const position: [number, number, number] =
      room.wallMount.axis === "z"
        ? [
            centerX,
            centerY + 0.2,
            centerZ +
              (room.wallMount.side === "min"
                ? cameraDistance
                : -cameraDistance),
          ]
        : [
            centerX +
              (room.wallMount.side === "min"
                ? cameraDistance
                : -cameraDistance),
            centerY + 0.2,
            centerZ,
          ];

    return {
      room,
      allLamps,
      camera: {
        position: (() => {
          position[2] = position[2] - 1; // Adjust the camera's Z position
          position[1] = position[1] + 3 + CAMERA_VERTICAL_LIFT;
          return position;
        })(),
        target: [target[0], target[1] + CAMERA_VERTICAL_LIFT, target[2]],
      },
    };
  }, [allLamps, room]);
}
