import type { Group } from "three";

import type { LavaLampRenderSnapshot } from "@/simulation/core/LavaLampRenderer.types";

export type OneLampProps = {
  autoSpin?: boolean;
};

export type RenderBlob = {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
};

export type OneLampState = {
  lampScene: Group;
  modelOffset: {
    x: number;
    y: number;
    z: number;
  };
  renderBlobs: RenderBlob[];
  snapshot: LavaLampRenderSnapshot;
};
