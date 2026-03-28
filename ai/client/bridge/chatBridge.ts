"use client";

import { resumeChat } from "@/ai/server/actions/resumeChat";
import { submitChat } from "@/ai/server/actions/submitChat";

import { executeClientAction } from "../executors/executeClientAction";
import type {
  ChatBridgeClientExecutorContext,
  ChatBridgeQuota,
  ChatBridgeRunResult,
} from "./chatBridge.types";

const MAX_CLIENT_ACTION_ROUNDS = 3;

export async function runChatBridge(
  message: string,
  context: ChatBridgeClientExecutorContext,
): Promise<ChatBridgeRunResult> {
  let response = await submitChat({
    entropyContext: context.getEntropyContext?.() ?? null,
    message,
  });

  for (let round = 0; round < MAX_CLIENT_ACTION_ROUNDS; round += 1) {
    if (response.type === "final") {
      return response;
    }

    const toolResult = await executeClientAction(response.action, context);

    response = await resumeChat({
      actionId: response.action.actionId,
      entropyContext: context.getEntropyContext?.() ?? null,
      toolResult,
    });
  }

  throw new Error(
    "The assistant exceeded the allowed client action loop limit for this request.",
  );
}

export async function fetchChatQuota(): Promise<ChatBridgeQuota> {
  const response = await fetch("/api/ai/quota", {
    method: "GET",
  });

  const responsePayload = (await response.json()) as {
    error?: string;
    quota?: number;
    remainingQuota?: number;
    resetAtIso?: string;
  };

  if (!response.ok) {
    throw new Error(
      typeof responsePayload.error === "string"
        ? responsePayload.error
        : "AI quota read failed.",
    );
  }

  return {
    quota: typeof responsePayload.quota === "number" ? responsePayload.quota : 0,
    remainingQuota:
      typeof responsePayload.remainingQuota === "number"
        ? responsePayload.remainingQuota
        : 0,
    resetAtIso:
      typeof responsePayload.resetAtIso === "string"
        ? responsePayload.resetAtIso
        : "",
  };
}
