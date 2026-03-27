"use client";

import type {
  ChatMessage,
  ChatRequestPayload,
  ChatResponsePayload,
} from "../types/chat.types";
import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

export async function sendChatRequest(
  messages: ChatMessage[],
  entropyContext?: ChatEntropyContext | null,
) {
  const requestPayload: ChatRequestPayload = {
    entropyContext,
    messages,
  };

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  const responsePayload = (await response.json()) as
    | ChatResponsePayload
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in responsePayload && typeof responsePayload.error === "string"
        ? responsePayload.error
        : "AI chat request failed.",
    );
  }

  return responsePayload as ChatResponsePayload;
}

export async function fetchChatQuota() {
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

  return responsePayload;
}
