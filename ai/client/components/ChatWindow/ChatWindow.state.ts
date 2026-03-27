"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchChatQuota,
  sendChatRequest,
} from "../../actions/chat.actions";
import type { ChatMessage } from "../../types/chat.types";
import type { ChatWindowProps, ChatWindowState } from "./ChatWindow.types";
import {
  MAX_DAILY_CHAT_MESSAGES,
  MAX_CHAT_USER_MESSAGE_LENGTH,
} from "@/ai/constants/chat.constants";

export function useChatWindowState({
  getEntropyContext,
  onEntropyCommand,
  onSimulationCommand,
}: Pick<
  ChatWindowProps,
  "getEntropyContext" | "onEntropyCommand" | "onSimulationCommand"
>) {
  const [state, setState] = useState<ChatWindowState>({
    error: null,
    entropyContextUsed: false,
    input: "",
    intent: null,
    isSubmitting: false,
    isQuotaReady: false,
    memorySummaryStored: false,
    messagesLeft: MAX_DAILY_CHAT_MESSAGES,
    messages: [],
    retrievedTools: [],
  });

  const hydrateQuotaFromServer = useCallback(async () => {
    try {
      const quota = await fetchChatQuota();
      const usageCount = normalizeUsageCount(quota.quota);

      setState((currentState) => ({
        ...currentState,
        isQuotaReady: true,
        messagesLeft: getMessagesLeft(usageCount),
      }));
    } catch {
      setState((currentState) => ({
        ...currentState,
        error: "The quota state could not be loaded.",
        isQuotaReady: true,
      }));
    }
  }, []);

  useEffect(() => {
    void hydrateQuotaFromServer();
  }, [hydrateQuotaFromServer]);

  const setInput = useCallback((input: string) => {
    setState((currentState) => ({
      ...currentState,
      error: null,
      input,
    }));
  }, []);

  const submit = useCallback(async () => {
    const trimmedInput = state.input.trim();

    if (!trimmedInput || state.isSubmitting || !state.isQuotaReady) {
      return;
    }

    if (state.messagesLeft <= 0) {
      setState((currentState) => ({
        ...currentState,
        error: "You have reached your message limit for today.",
      }));

      return;
    }

    if (trimmedInput.length > MAX_CHAT_USER_MESSAGE_LENGTH) {
      setState((currentState) => ({
        ...currentState,
        error: `Each user message is limited to ${MAX_CHAT_USER_MESSAGE_LENGTH} characters.`,
      }));

      return;
    }

    const nextMessages: ChatMessage[] = [
      ...state.messages,
      {
        role: "user",
        content: trimmedInput,
      },
    ];

    setState((currentState) => ({
      ...currentState,
      error: null,
      input: "",
      isSubmitting: true,
      messages: nextMessages,
    }));

    try {
      const response = await sendChatRequest(
        nextMessages,
        getEntropyContext?.() ?? null,
      );

      let localFollowUpMessage: ChatMessage | null = null;

      if (response.command?.kind === "set-simulation-parameter" && onSimulationCommand) {
        onSimulationCommand(response.command);
      }

      if (response.command?.kind === "run-entropy-capture" && onEntropyCommand) {
        const entropySummary = await onEntropyCommand(response.command.frameCount);

        localFollowUpMessage = {
          role: "assistant",
          content:
            entropySummary ??
            "The entropy run did not produce a summary. Please try again with fewer frames.",
        };
      }
      const quota = await fetchChatQuota();
      const usageCount = normalizeUsageCount(quota.quota);

      setState((currentState) => ({
        ...currentState,
        entropyContextUsed: response.entropyContextUsed,
        intent: response.intent,
        isSubmitting: false,
        memorySummaryStored: response.memorySummaryStored,
        messagesLeft: getMessagesLeft(usageCount),
        messages: [
          ...nextMessages,
          {
            role: "assistant",
            content: response.answer,
          },
          ...(localFollowUpMessage ? [localFollowUpMessage] : []),
        ],
        retrievedTools: response.retrievedTools,
      }));
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        error:
          error instanceof Error ? error.message : "Chat request failed.",
        isSubmitting: false,
      }));
    }
  }, [
    getEntropyContext,
    onEntropyCommand,
    onSimulationCommand,
    state.input,
    state.isSubmitting,
    state.isQuotaReady,
    state.messagesLeft,
    state.messages,
  ]);

  return {
    ...state,
    setInput,
    submit,
  };
}

function getMessagesLeft(usageCount: number) {
  return Math.max(0, MAX_DAILY_CHAT_MESSAGES - usageCount);
}

function normalizeUsageCount(usageCount: unknown) {
  return typeof usageCount === "number" && Number.isFinite(usageCount) && usageCount >= 0
    ? usageCount
    : 0;
}
