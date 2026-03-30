import type { LavaLampRenderer } from "@/simulation/core/LavaLampRenderer";
import type { RoomWallMount } from "@/components/organisms/Room/Room.types";
import type { PreparedLampModel } from "@/components/organisms/Lamp/Lamp.types";

export type LampBoard = {
  position: {
    x: number;
    y: number;
    z: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
};

export type LampInstance = {
  lampId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  renderer: LavaLampRenderer;
};

export type AllLampsProps = {
  preparedModel: PreparedLampModel;
  lamps: LampInstance[];
  boards: LampBoard[];
};

export type AllLampsState = {
  preparedModel: PreparedLampModel;
  lamps: LampInstance[];
  boards: LampBoard[];
};

export type AllLampsStateArgs = {
  lampCount: number;
  wallMount: RoomWallMount;
};
