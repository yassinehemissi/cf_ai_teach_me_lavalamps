import "server-only";

import { isAIMessage } from "@langchain/core/messages";

import type { ChatStateValue } from "../chat.state";
import { buildClientActionFromToolCall } from "../utils/clientAction";
import { extractMessageText } from "../utils/messageText";

export async function tools(state: ChatStateValue) {
  const lastMessage = state.messages[state.messages.length - 1];

  if (!isAIMessage(lastMessage) || !lastMessage.tool_calls?.length) {
    return {};
  }

  const firstToolCall = lastMessage.tool_calls[0];
  const pendingClientAction = buildClientActionFromToolCall(
    firstToolCall,
    extractMessageText(lastMessage) || null,
  );

  if (!pendingClientAction) {
    return {
      finalResponse: {
        answer:
          "I generated an invalid client tool call and could not continue safely. Please rephrase the request.",
        memorySummaryStored: false,
        type: "final" as const,
      },
      pendingClientAction: null,
    };
  }

  return {
    pendingClientAction,
  };
}
