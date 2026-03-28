import "server-only";

import type { BaseMessage } from "@langchain/core/messages";

import { AGENT_MEMORY_CONTEXT_THRESHOLD } from "../constants/agent.constants";
import type {
  ChatMemoryRecord,
  ChatUserMetadata,
} from "../chat/chat.types";
import { toMemorySummaryLines, extractMessageText } from "../chat/utils/messageText";
import { MEMORY_SUMMARY_PROMPT } from "../prompts/memoryPrompt";
import {
  appendMemorySummary,
  createChatMemoryRecord,
  loadRelevantMemory,
} from "./vectorMemory";

const CONTEXT_CHARACTER_BUDGET = 12_000;

export async function loadUserMemory(user: ChatUserMetadata, query: string) {
  return loadRelevantMemory(user, query);
}

export async function maybePersistConversationSummary({
  messages,
  user,
}: {
  messages: BaseMessage[];
  user: ChatUserMetadata;
}) {
  const contextRatio = estimateContextUsage(messages) / CONTEXT_CHARACTER_BUDGET;

  if (contextRatio < AGENT_MEMORY_CONTEXT_THRESHOLD) {
    return null;
  }

  const summary = summarizeMessages(messages);
  const record = createChatMemoryRecord({
    summary,
    tags: ["chat-summary"],
    user,
  });
  await appendMemorySummary(user, record);

  return record;
}

export function buildMemoryContext(memoryRecords: ChatMemoryRecord[]) {
  if (memoryRecords.length === 0) {
    return "";
  }

  return [
    MEMORY_SUMMARY_PROMPT,
    ...memoryRecords.slice(-5).map((record) => `- ${record.summary}`),
  ].join("\n");
}

function estimateContextUsage(messages: BaseMessage[]) {
  return messages.reduce(
    (total, message) => total + extractMessageText(message).length,
    0,
  );
}

function summarizeMessages(messages: BaseMessage[]) {
  return toMemorySummaryLines(messages).join(" | ");
}
