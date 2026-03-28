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
    command: action.args,
    status: "completed" as const,
    summary: buildSimulationSummary(action),
    toolName: "controlSimulation" as const,
  };
}

function buildSimulationSummary(action: ControlSimulationClientAction) {
  if (action.args.mode === "absolute") {
    return `Set ${action.args.key} to ${action.args.value}.`;
  }

  return `Adjusted ${action.args.key} by ${action.args.delta}.`;
}
