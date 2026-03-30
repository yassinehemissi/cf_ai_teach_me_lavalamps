import {
  type LavaLampPlacement,
} from "./LavaLampSimulation";
import { LavaLampRenderer } from "./LavaLampRenderer";
import type {
  LavaLampRendererEntry,
  LavaLampWallLayout,
  RegisteredLavaLampRenderer,
} from "./LavaLampSimulationRegistry.types";

export class LavaLampSimulationRegistry {
  private readonly renderers = new Map<string, LavaLampRenderer>();

  // Builds a row-based wall layout of renderer entries in O(n).
  static createWallEntries({
    createRenderer,
    lampIds,
    layout,
  }: {
    lampIds: string[];
    layout: LavaLampWallLayout;
    createRenderer: (
      placement: LavaLampPlacement,
      lampId: string,
      index: number,
    ) => LavaLampRenderer;
  }): LavaLampRendererEntry[] {
    if (layout.lampsPerRow < 1) {
      throw new Error("lampsPerRow must be greater than 0.");
    }

    const entries: LavaLampRendererEntry[] = [];
    const placement = { ...layout.origin };

    for (const [index, lampId] of lampIds.entries()) {
      const nextPlacement = { ...placement };

      entries.push({
        lampId,
        renderer: createRenderer(nextPlacement, lampId, index),
      });

      const shouldSkipLine = (index + 1) % layout.lampsPerRow === 0;

      if (shouldSkipLine) {
        placement.x = layout.origin.x;
        placement.y += layout.yGap;
        continue;
      }

      placement.x += layout.xGap;
    }

    return entries;
  }

  // Seeds the registry with an optional set of renderer entries.
  constructor(entries: LavaLampRendererEntry[] = []) {
    for (const entry of entries) {
      this.renderers.set(entry.lampId, entry.renderer);
    }
  }

  // Returns the full registry as a stable array snapshot.
  getAll(): RegisteredLavaLampRenderer[] {
    return Array.from(this.renderers.entries()).map(([lampId, renderer]) => ({
        lampId,
        placement: renderer.placement,
        renderer,
      }));
  }
}
