"use client";

import type { RoomProps } from "./Room.types";

export function Room({ roomScene, roomScale }: RoomProps) {
  return <primitive object={roomScene} scale={[roomScale, roomScale, roomScale]} />;
}
