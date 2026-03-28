import "server-only";

import { isAIMessage } from "@langchain/core/messages";

import type { ChatStateValue } from "../chat.state";
import { extractMessageText } from "../utils/messageText";

const FALLBACK_FAILURE_MESSAGE =
  "I could not complete the answer confidently after three attempts. Please provide more context or narrow the request.";

export async function finalize(state: ChatStateValue) {
  if (state.finalResponse) {
    return {
      finalResponse: {
        ...state.finalResponse,
        memorySummaryStored: state.memorySummaryStored,
      },
    };
  }

  if (state.pendingClientAction) {
    const lastMessage = state.messages[state.messages.length - 1];
    const answer = extractMessageText(lastMessage);

    return {
      finalResponse: {
        action: state.pendingClientAction,
        answer: answer || state.pendingClientAction.uiMessage,
        memorySummaryStored: state.memorySummaryStored,
        type: "client-action" as const,
      },
    };
  }

  const lastMessage = state.messages[state.messages.length - 1];
  const answer =
    isAIMessage(lastMessage) && extractMessageText(lastMessage)
      ? extractMessageText(lastMessage)
      : FALLBACK_FAILURE_MESSAGE;

  return {
    finalResponse: {
      answer,
      memorySummaryStored: state.memorySummaryStored,
      type: "final" as const,
    },
  };
}
