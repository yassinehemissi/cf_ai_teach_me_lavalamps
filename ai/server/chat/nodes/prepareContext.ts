import "server-only";

import type { SystemMessage } from "@langchain/core/messages";

import { buildMemoryContext, loadUserMemory } from "../../memory/memoryPolicy";
import type { ChatStateValue } from "../chat.state";
import { getLatestUserMessageText } from "../utils/messageText";

export async function prepareContext(state: ChatStateValue) {
  if (!state.user) {
    throw new Error("Chat graph state is missing authenticated user metadata.");
  }

  const latestUserMessage = getLatestUserMessageText(state.messages);
  const memoryRecords = await loadUserMemory(
    state.user,
    latestUserMessage ? latestUserMessage.content.toString() : "",
  );

  return {
    finalResponse: null,
    memoryContext: buildMemoryContext(memoryRecords),
    memorySummaryStored: false,
    pendingClientAction: null,
  } satisfies Partial<ChatStateValue & { systemMessage?: SystemMessage }>;
}
