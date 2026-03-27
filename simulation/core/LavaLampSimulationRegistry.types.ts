import type {
  LavaLampPlacement,
} from "./LavaLampSimulation";
import type { LavaLampRenderer } from "./LavaLampRenderer";

export type LavaLampRendererEntry = {
  lampId: string;
  renderer: LavaLampRenderer;
};

export type RegisteredLavaLampRenderer = LavaLampRendererEntry & {
  placement: LavaLampPlacement;
};

export type LavaLampWallLayout = {
  origin: LavaLampPlacement;
  lampsPerRow: number;
  xGap: number;
  yGap: number;
};
