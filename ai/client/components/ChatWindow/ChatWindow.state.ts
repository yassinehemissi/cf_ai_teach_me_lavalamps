"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchChatQuota,
  runChatBridge,
} from "../../bridge/chatBridge";
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
    input: "",
    isSubmitting: false,
    isQuotaReady: false,
    memorySummaryStored: false,
    messagesLeft: MAX_DAILY_CHAT_MESSAGES,
    messages: [],
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
      const response = await runChatBridge(trimmedInput, {
        getEntropyContext,
        onEntropyCommand,
        onSimulationCommand,
      });
      const quota = await fetchChatQuota();
      const usageCount = normalizeUsageCount(quota.quota);

      setState((currentState) => ({
        ...currentState,
        isSubmitting: false,
        memorySummaryStored: response.memorySummaryStored,
        messagesLeft: getMessagesLeft(usageCount),
        messages: [
          ...nextMessages,
          {
            role: "assistant",
            content: response.answer,
          },
        ],
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
