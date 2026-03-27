"use client";

import { useMemo } from "react";
import { Group } from "three";

import type { RoomState } from "./Room.types";
import { useBrowserReady } from "./utils/roomBrowser";
import { ROOM_SCALE } from "./utils/room.constants";
import { createRoomBounds, createWallMount } from "./utils/roomLayout";
import { createRoomScene } from "./utils/roomScene";

export function useRoomState(): RoomState {
  const isBrowserReady = useBrowserReady();
  const roomBounds = useMemo(() => createRoomBounds(), []);
  const wallMount = useMemo(() => createWallMount(roomBounds), [roomBounds]);
  const roomScene = useMemo(
    () => (isBrowserReady ? createRoomScene(roomBounds) : new Group()),
    [isBrowserReady, roomBounds],
  );

  return useMemo(
    () => ({
      roomScale: ROOM_SCALE,
      roomScene,
      wallMount,
    }),
    [roomScene, wallMount],
  );
}
