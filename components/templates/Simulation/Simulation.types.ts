import type { AllLampsState } from "@/components/organisms/AllLamps/AllLamps.types";
import type { RoomState } from "@/components/organisms/Room/Room.types";

export type SimulationState = {
  room: RoomState;
  allLamps: AllLampsState;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
};
