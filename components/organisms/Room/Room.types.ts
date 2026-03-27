import type { Group } from "three";

export type RoomWallAxis = "x" | "z";
export type RoomWallSide = "min" | "max";

export type RoomBounds = {
  min: {
    x: number;
    y: number;
    z: number;
  };
  max: {
    x: number;
    y: number;
    z: number;
  };
};

export type RoomWallMount = {
  axis: RoomWallAxis;
  side: RoomWallSide;
  wallValue: number;
  roomBounds: RoomBounds;
  doorWall: {
    axis: RoomWallAxis;
    side: RoomWallSide;
    wallValue: number;
  };
};

export type RoomState = {
  roomScene: Group;
  roomScale: number;
  wallMount: RoomWallMount;
};

export type RoomProps = {
  roomScene: Group;
  roomScale: number;
};
