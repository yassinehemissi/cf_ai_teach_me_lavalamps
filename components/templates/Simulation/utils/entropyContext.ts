import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

import type { EntropyModalSummary } from "../SimulationEntropy.types";

export function buildChatEntropyContext(
  summary: EntropyModalSummary | null,
): ChatEntropyContext | null {
  if (!summary) {
    return null;
  }

  return {
    aggregate: summary.aggregate,
    frames: summary.frames.map((frame) => ({
      digestHex: frame.digest.hex,
      frameIndex: frame.capture.frameIndex,
      height: frame.resize.height,
      rgbaByteLength: frame.rgba.byteLength,
      sourceHeight: frame.resize.sourceHeight,
      sourceWidth: frame.resize.sourceWidth,
      timingNoiseByteLength: frame.timingNoise.byteLength,
      totalTimingMs: sumTimings(frame.timingsMs),
      width: frame.resize.width,
    })),
  };
}

function sumTimings(timings: EntropyModalSummary["frames"][number]["timingsMs"]) {
  return Number(
    Object.values(timings).reduce((total, value) => total + value, 0).toFixed(3),
  );
}
