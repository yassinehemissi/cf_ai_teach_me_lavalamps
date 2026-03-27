import type { RoomBounds, RoomWallMount } from "../Room.types";

import {
  DOOR_CENTER_Z,
  DOOR_HEIGHT,
  DOOR_WIDTH,
  ROOM_DEPTH,
  ROOM_HEIGHT,
  ROOM_WIDTH,
} from "./room.constants";

export function createRoomBounds(): RoomBounds {
  return {
    min: {
      x: -ROOM_WIDTH * 0.5,
      y: 0,
      z: -ROOM_DEPTH * 0.5,
    },
    max: {
      x: ROOM_WIDTH * 0.5,
      y: ROOM_HEIGHT,
      z: ROOM_DEPTH * 0.5,
    },
  };
}

export function createWallMount(roomBounds: RoomBounds): RoomWallMount {
  return {
    axis: "z",
    side: "min",
    wallValue: roomBounds.min.z,
    roomBounds,
    doorWall: {
      axis: "x",
      side: "min",
      wallValue: roomBounds.min.x,
    },
  };
}

export function getDoorLayout(roomBounds: RoomBounds) {
  const doorMinZ = DOOR_CENTER_Z - DOOR_WIDTH * 0.5;
  const doorMaxZ = DOOR_CENTER_Z + DOOR_WIDTH * 0.5;
  const doorTopY = roomBounds.min.y + DOOR_HEIGHT;

  return {
    doorMinZ,
    doorMaxZ,
    doorTopY,
    doorWidth: DOOR_WIDTH,
  };
}
