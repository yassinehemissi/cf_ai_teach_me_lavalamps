"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchChatQuota,
  sendChatRequest,
  syncChatUsage,
} from "../../actions/chat.actions";
import type { ChatMessage } from "../../types/chat.types";
import type { ChatWindowProps, ChatWindowState } from "./ChatWindow.types";
import {
  CHAT_USAGE_SYNC_DEBOUNCE_MS,
  MAX_DAILY_CHAT_MESSAGES,
  MAX_CHAT_USER_MESSAGE_LENGTH,
} from "@/ai/constants/chat.constants";

const LOCAL_CHAT_USAGE_STORAGE_KEY = "ai-chat-local-usage";
const PENDING_CHAT_USAGE_STORAGE_KEY = "ai-chat-pending-usage";

export function useChatWindowState({
  getEntropyContext,
  onEntropyCommand,
  onSimulationCommand,
}: Pick<
  ChatWindowProps,
  "getEntropyContext" | "onEntropyCommand" | "onSimulationCommand"
>) {
  const flushPendingUsageRef = useRef<() => Promise<void>>(async () => {});
  const localUsageCountRef = useRef(0);
  const pendingUsageRef = useRef(0);
  const syncTimeoutRef = useRef<number | null>(null);
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

  const scheduleUsageSync = useCallback(() => {
    if (
      typeof window === "undefined" ||
      pendingUsageRef.current <= 0 ||
      syncTimeoutRef.current !== null
    ) {
      return;
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      syncTimeoutRef.current = null;
      void flushPendingUsageRef.current();
    }, CHAT_USAGE_SYNC_DEBOUNCE_MS);
  }, []);

  const flushPendingUsage = useCallback(async () => {
    if (pendingUsageRef.current <= 0) {
      return;
    }

    const usageCount = pendingUsageRef.current;

    pendingUsageRef.current = 0;
    persistPendingUsage(0);

    try {
      await syncChatUsage(usageCount);
    } catch {
      pendingUsageRef.current += usageCount;
      persistPendingUsage(pendingUsageRef.current);
      scheduleUsageSync();
    }
  }, [scheduleUsageSync]);

  useEffect(() => {
    flushPendingUsageRef.current = flushPendingUsage;
  }, [flushPendingUsage]);

  const hydrateQuotaFromServer = useCallback(async () => {
    try {
      const quota = await fetchChatQuota();
      const usageCount = normalizeUsageCount(quota.quota);

      localUsageCountRef.current = usageCount;
      persistLocalUsageCount(usageCount);

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
    const localUsageCount = readLocalUsageCount();

    localUsageCountRef.current = localUsageCount ?? 0;
    pendingUsageRef.current = readPendingUsage();

    if (localUsageCount !== null) {
      setState((currentState) => ({
        ...currentState,
        isQuotaReady: true,
        messagesLeft: getMessagesLeft(localUsageCount),
      }));
    } else {
      void hydrateQuotaFromServer();
    }

    if (pendingUsageRef.current > 0) {
      scheduleUsageSync();
    }

    return () => {
      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [hydrateQuotaFromServer, scheduleUsageSync]);

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

      const nextUsageCount = localUsageCountRef.current + 1;

      localUsageCountRef.current = nextUsageCount;
      pendingUsageRef.current += 1;
      persistLocalUsageCount(nextUsageCount);
      persistPendingUsage(pendingUsageRef.current);
      scheduleUsageSync();

      setState((currentState) => ({
        ...currentState,
        entropyContextUsed: response.entropyContextUsed,
        intent: response.intent,
        isSubmitting: false,
        memorySummaryStored: response.memorySummaryStored,
        messagesLeft: getMessagesLeft(nextUsageCount),
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
    scheduleUsageSync,
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

function readPendingUsage() {
  if (typeof window === "undefined") {
    return 0;
  }

  const rawValue = window.sessionStorage.getItem(PENDING_CHAT_USAGE_STORAGE_KEY);
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : 0;

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function persistPendingUsage(usageCount: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    PENDING_CHAT_USAGE_STORAGE_KEY,
    String(Math.max(0, usageCount)),
  );
}

function readLocalUsageCount() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(LOCAL_CHAT_USAGE_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as {
      dayKey?: unknown;
      usageCount?: unknown;
    };
    const currentDayKey = getCurrentQuotaDayKey();

    if (
      parsedValue.dayKey !== currentDayKey ||
      typeof parsedValue.usageCount !== "number" ||
      !Number.isFinite(parsedValue.usageCount) ||
      parsedValue.usageCount < 0
    ) {
      persistLocalUsageCount(0);

      return 0;
    }

    return parsedValue.usageCount;
  } catch {
    persistLocalUsageCount(0);

    return 0;
  }
}

function persistLocalUsageCount(usageCount: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    LOCAL_CHAT_USAGE_STORAGE_KEY,
    JSON.stringify({
      dayKey: getCurrentQuotaDayKey(),
      usageCount: Math.max(0, usageCount),
    }),
  );
}

function getCurrentQuotaDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getMessagesLeft(usageCount: number) {
  return Math.max(0, MAX_DAILY_CHAT_MESSAGES - usageCount);
}

function normalizeUsageCount(usageCount: unknown) {
  return typeof usageCount === "number" && Number.isFinite(usageCount) && usageCount >= 0
    ? usageCount
    : 0;
}
