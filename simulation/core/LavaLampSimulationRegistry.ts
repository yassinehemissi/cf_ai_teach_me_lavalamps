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
  private readonly placements = new Map<string, LavaLampPlacement>();

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

  constructor(entries: LavaLampRendererEntry[] = []) {
    for (const entry of entries) {
      const placement = entry.renderer.placement;

      this.renderers.set(entry.lampId, entry.renderer);
      this.placements.set(entry.lampId, placement);
    }
  }

  register(entry: LavaLampRendererEntry): void {
    const placement = entry.renderer.placement;

    this.renderers.set(entry.lampId, entry.renderer);
    this.placements.set(entry.lampId, placement);
  }

  unregister(lampId: string): void {
    this.renderers.delete(lampId);
    this.placements.delete(lampId);
  }

  get(lampId: string): LavaLampRenderer | undefined {
    return this.renderers.get(lampId);
  }

  getPlacement(lampId: string): LavaLampPlacement | undefined {
    return this.placements.get(lampId);
  }

  getAll(): RegisteredLavaLampRenderer[] {
    return Array.from(this.renderers.entries()).map(([lampId, renderer]) => ({
        lampId,
        placement: renderer.placement,
        renderer,
      }));
  }

  getPlacements(): Record<string, LavaLampPlacement> {
    return Object.fromEntries(this.placements.entries());
  }

  resetAll(): void {
    for (const renderer of this.renderers.values()) {
      renderer.reset();
    }
  }
}
