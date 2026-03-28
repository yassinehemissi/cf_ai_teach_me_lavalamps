"use client";

import type { RunEntropyCaptureClientAction } from "@/ai/server/chat/chat.types";

import type { ClientExecutorContext } from "./executor.types";

export async function runEntropyCapture(
  action: RunEntropyCaptureClientAction,
  context: ClientExecutorContext,
) {
  const summary =
    (await context.onEntropyCommand?.(action.args.frameCount)) ??
    `Entropy run completed for ${action.args.frameCount} frame(s).`;

  return {
    actionId: action.actionId,
    frameCount: action.args.frameCount,
    status: "completed" as const,
    summary,
    toolName: "runEntropyCapture" as const,
  };
}
