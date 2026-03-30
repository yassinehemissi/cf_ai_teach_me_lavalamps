"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  createLampRenderer,
  LAVA_LAMP_MODEL_URL,
  prepareLampModel,
} from "@/components/organisms/Lamp/utils";
import { LavaLampSimulationRegistry } from "@/simulation/core/LavaLampSimulationRegistry";

import type {
  AllLampsState,
  AllLampsStateArgs,
  LampBoard,
  LampInstance,
} from "./AllLamps.types";

const MAX_LAMP_COUNT = 6;
const MAX_LAMP_ROW_COUNT = 2;
const MAX_LAMP_COLUMN_COUNT = 3;
const WALL_DEPTH_OFFSET = 1.2;
const HORIZONTAL_MARGIN = 1.35;
const LAMP_GAP_MULTIPLIER = 1.5;
const WALL_CENTERING_Y_OFFSET = 0;
const BOARD_DEPTH = 0.8;
const BOARD_HEIGHT = 0.58;
const BOARD_VERTICAL_CLEARANCE = 0.48;

export function useAllLampsState({
  lampCount,
  wallMount,
}: AllLampsStateArgs): AllLampsState {
  const gltf = useLoader(GLTFLoader, LAVA_LAMP_MODEL_URL);
  const preparedModel = useMemo(
    () => prepareLampModel(gltf.scene.clone(true)),
    [gltf.scene],
  );

  return useMemo(() => {
    const clampedLampCount = clampLampCount(lampCount);
    const lampRowCount = Math.min(
      MAX_LAMP_ROW_COUNT,
      Math.ceil(clampedLampCount / MAX_LAMP_COLUMN_COUNT),
    );
    const lampColumnCount = Math.min(clampedLampCount, MAX_LAMP_COLUMN_COUNT);
    const horizontalAxis = wallMount.axis === "z" ? "x" : "z";
    const horizontalMin =
      wallMount.roomBounds.min[horizontalAxis] + HORIZONTAL_MARGIN;
    const horizontalMax =
      wallMount.roomBounds.max[horizontalAxis] - HORIZONTAL_MARGIN;
    const horizontalCenter = (horizontalMin + horizontalMax) * 0.5;
    const wallVerticalCenter =
      (wallMount.roomBounds.min.y + wallMount.roomBounds.max.y) * 0.5;
    const lampHorizontalSize = Math.max(
      horizontalAxis === "x" ? preparedModel.modelSize.x : preparedModel.modelSize.z,
      0.1,
    );
    const lampVerticalSize = Math.max(preparedModel.modelSize.y, 0.1);
    const commonLampGap =
      Math.max(lampHorizontalSize, lampVerticalSize) * LAMP_GAP_MULTIPLIER;
    const horizontalSpan = commonLampGap * Math.max(lampColumnCount - 1, 0);
    const verticalSpan = commonLampGap * Math.max(lampRowCount - 1, 0);
    const horizontalStart = horizontalCenter - horizontalSpan * 0.5;
    const verticalTop =
      wallVerticalCenter + verticalSpan * 0.5 + WALL_CENTERING_Y_OFFSET;
    const wallCoordinate =
      wallMount.side === "min"
        ? wallMount.wallValue + WALL_DEPTH_OFFSET
        : wallMount.wallValue - WALL_DEPTH_OFFSET;
    const lampIds = Array.from(
      { length: clampedLampCount },
      (_, index) => `lamp-${index}`,
    );
    const registry = new LavaLampSimulationRegistry(
      LavaLampSimulationRegistry.createWallEntries({
        lampIds,
        layout: {
          origin: {
            x: horizontalStart,
            y: verticalTop,
            z: 0,
          },
          xGap: commonLampGap,
          yGap: -commonLampGap,
          lampsPerRow: lampColumnCount,
        },
        createRenderer: (placement, lampId, index) => {
          const worldPlacement =
            wallMount.axis === "z"
              ? {
                  x: placement.x,
                  y: placement.y,
                  z: wallCoordinate,
                }
              : {
                  x: wallCoordinate,
                  y: placement.y,
                  z: placement.x,
                };

          return createLampRenderer(preparedModel, worldPlacement, 20260327 + index * 101);
        },
      }),
    );
    const lamps: LampInstance[] = registry.getAll().map(({ lampId, renderer }) => ({
      lampId,
      position: renderer.placement,
      renderer,
    }));
    const boardWidth = horizontalSpan + lampHorizontalSize + 1;
    const boardCenter = horizontalCenter;
    const boards: LampBoard[] = Array.from(
      { length: lampRowCount },
      (_, rowIndex) => {
        const rowY =
          verticalTop -
          commonLampGap * rowIndex +
          BOARD_VERTICAL_CLEARANCE -
          lampVerticalSize * 0.5;

        return {
          position:
            wallMount.axis === "z"
              ? {
                  x: boardCenter,
                  y: rowY,
                  z: wallCoordinate - (wallMount.side === "min" ? BOARD_DEPTH * 0.5 : -BOARD_DEPTH * 0.5),
                }
              : {
                  x: wallCoordinate - (wallMount.side === "min" ? BOARD_DEPTH * 0.5 : -BOARD_DEPTH * 0.5),
                  y: rowY,
                  z: boardCenter,
                },
          scale:
            wallMount.axis === "z"
              ? {
                  x: boardWidth,
                  y: BOARD_HEIGHT,
                  z: BOARD_DEPTH,
                }
              : {
                  x: BOARD_DEPTH,
                  y: BOARD_HEIGHT,
                  z: boardWidth,
                },
        };
      },
    );

    return {
      preparedModel,
      lamps,
      boards,
    };
  }, [lampCount, preparedModel, wallMount]);
}

function clampLampCount(value: number) {
  return Math.min(Math.max(Math.floor(value) || 1, 1), MAX_LAMP_COUNT);
}
