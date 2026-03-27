import "server-only";

import type { SimulationCommand } from "@/ai/types/command.types";

const DEFAULT_FRAME_COUNT = 1;
const MAX_FRAME_COUNT = 12;
const MIN_FRAME_COUNT = 1;

export function buildEntropyCommand(input: string): SimulationCommand | null {
  if (!/\b(entropy|worker|digest|capture|screenshot)\b/i.test(input)) {
    return null;
  }

  if (!hasExplicitEntropyExecutionIntent(input)) {
    return null;
  }

  const explicitFrameMatch = input.match(/(\d+)\s*(?:frames?|shots?)/i);
  const frameCount = clampFrameCount(
    explicitFrameMatch ? Number(explicitFrameMatch[1]) : DEFAULT_FRAME_COUNT,
  );

  return {
    kind: "run-entropy-capture",
    frameCount,
  };
}

function clampFrameCount(frameCount: number) {
  return Math.min(MAX_FRAME_COUNT, Math.max(MIN_FRAME_COUNT, Math.floor(frameCount)));
}

function hasExplicitEntropyExecutionIntent(input: string) {
  if (/\b(?:what is|what does|how does|why|explain|describe|tell me|analyze|analyse|should|could|would)\b/i.test(input)) {
    return false;
  }

  return /\b(?:run|capture|take|generate|extract|compute|do|start|launch)\b/i.test(
    input,
  );
}
