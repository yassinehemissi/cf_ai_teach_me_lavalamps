import "server-only";

import {
  AGENT_MEMORY_CONTEXT_THRESHOLD,
} from "../constants/agent.constants";
import {
  BASE_AGENT_SYSTEM_PROMPT,
  MEMORY_SUMMARY_SYSTEM_PROMPT,
} from "../prompts/systemPrompts";
import {
  createAgentMemoryRecord,
  appendMemorySummary,
  loadRelevantMemory,
} from "./vectorMemory";
import type {
  AgentChatMessage,
  AgentMemoryRecord,
  AgentUserMetadata,
} from "../types/agent.types";

const CONTEXT_CHARACTER_BUDGET = 12_000;

export async function loadUserMemory(
  user: AgentUserMetadata,
  query: string,
) {
  return loadRelevantMemory(user, query);
}

export async function maybePersistConversationSummary({
  messages,
  user,
}: {
  messages: AgentChatMessage[];
  user: AgentUserMetadata;
}) {
  const contextRatio = estimateContextUsage(messages) / CONTEXT_CHARACTER_BUDGET;

  if (contextRatio < AGENT_MEMORY_CONTEXT_THRESHOLD) {
    return null;
  }

  const summary = summarizeMessages(messages);
  const record = createAgentMemoryRecord({
    summary,
    tags: ["chat-summary"],
    user,
  });
  await appendMemorySummary(user, record);

  return record;
}

export function buildMemoryContext(memoryRecords: AgentMemoryRecord[]) {
  if (memoryRecords.length === 0) {
    return "";
  }

  return [
    MEMORY_SUMMARY_SYSTEM_PROMPT,
    ...memoryRecords.slice(-5).map((record) => `- ${record.summary}`),
  ].join("\n");
}

export function buildPromptContext(messages: AgentChatMessage[]) {
  return [
    BASE_AGENT_SYSTEM_PROMPT,
    ...messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`),
  ].join("\n");
}

function estimateContextUsage(messages: AgentChatMessage[]) {
  return messages.reduce((total, message) => total + message.content.length, 0);
}

function summarizeMessages(messages: AgentChatMessage[]) {
  const relevantMessages = messages.slice(-8).map((message) => {
    const clippedContent =
      message.content.length > 180
        ? `${message.content.slice(0, 177)}...`
        : message.content;

    return `${message.role}: ${clippedContent}`;
  });

  return relevantMessages.join(" | ");
}
