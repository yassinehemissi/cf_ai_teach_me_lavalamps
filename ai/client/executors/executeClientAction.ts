"use client";

import type { ChatClientAction } from "@/ai/server/chat/chat.types";

import { applySimulationCommand } from "./applySimulationCommand";
import type { ClientExecutorContext } from "./executor.types";
import { runEntropyCapture } from "./runEntropyCapture";

export async function executeClientAction(
  action: ChatClientAction,
  context: ClientExecutorContext,
) {
  if (action.toolName === "controlSimulation") {
    return applySimulationCommand(action, context);
  }

  if (action.toolName === "runEntropyCapture") {
    return runEntropyCapture(action, context);
  }

  throw new Error("The assistant requested an unsupported client action.");
}
