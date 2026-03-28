"use client";

import type { RunEntropyCaptureClientAction } from "@/ai/server/chat/chat.types";

import type { ClientExecutorContext } from "./executor.types";

export async function runEntropyCapture(
  action: RunEntropyCaptureClientAction,
  context: ClientExecutorContext,
) {
  await context.onEntropyCommand?.(action.args.frameCount);

  return {
    actionId: action.actionId,
    status: "completed" as const,
    toolName: "runEntropyCapture" as const,
  };
}
