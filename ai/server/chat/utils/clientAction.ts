import type { ToolCall } from "@langchain/core/messages/tool";

import { controlSimulationActionArgsSchema } from "../chat.schema";
import type { ChatClientAction } from "../chat.types";
import { runEntropyCaptureActionArgsSchema } from "../chat.schema";

export function buildClientActionFromToolCall(
  toolCall: ToolCall,
  fallbackMessage: string | null,
): ChatClientAction | null {
  if (toolCall.name === "controlSimulation") {
    const parsedArgs = controlSimulationActionArgsSchema.safeParse(toolCall.args);

    if (!parsedArgs.success) {
      return null;
    }

    return {
      actionId: crypto.randomUUID(),
      args: parsedArgs.data,
      toolCallId: toolCall.id ?? crypto.randomUUID(),
      toolName: "controlSimulation",
      uiMessage:
        fallbackMessage || "Applying the requested bounded simulation update.",
    };
  }

  if (toolCall.name === "runEntropyCapture") {
    const parsedArgs = runEntropyCaptureActionArgsSchema.safeParse(toolCall.args);

    if (!parsedArgs.success) {
      return null;
    }

    return {
      actionId: crypto.randomUUID(),
      args: parsedArgs.data,
      toolCallId: toolCall.id ?? crypto.randomUUID(),
      toolName: "runEntropyCapture",
      uiMessage:
        fallbackMessage ||
        `Running entropy extraction for ${parsedArgs.data.frameCount} frame(s).`,
    };
  }

  return null;
}
