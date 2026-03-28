"use client";

import type { ControlSimulationClientAction } from "@/ai/server/chat/chat.types";

import type { ClientExecutorContext } from "./executor.types";

export async function applySimulationCommand(
  action: ControlSimulationClientAction,
  context: ClientExecutorContext,
) {
  context.onSimulationCommand?.(action.args);

  return {
    actionId: action.actionId,
    status: "completed" as const,
    toolName: "controlSimulation" as const,
  };
}
