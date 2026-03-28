import "server-only";

import { isAIMessage } from "@langchain/core/messages";

import type { ChatStateValue } from "../chat.state";
import { extractMessageText } from "../utils/messageText";
import { agentEnvelopeSchema } from "./parseFunctionCall.schema";

export async function parseFunctionCall(state: ChatStateValue) {
  const lastMessage = state.messages[state.messages.length - 1];

  if (!isAIMessage(lastMessage)) {
    return {
      finalResponse: {
        answer:
          "I could not interpret the assistant response safely. Please try again with a narrower request.",
        memorySummaryStored: false,
        type: "final" as const,
      },
      pendingClientAction: null,
    };
  }

  const parsedEnvelope = agentEnvelopeSchema.safeParse(
    parseAgentEnvelope(extractMessageText(lastMessage)),
  );

  if (!parsedEnvelope.success) {
    return {
      finalResponse: {
        answer:
          "I could not produce a valid structured action for that request. Please rephrase it more explicitly.",
        memorySummaryStored: false,
        type: "final" as const,
      },
      pendingClientAction: null,
    };
  }

  if (parsedEnvelope.data.type === "final") {
    return {
      finalResponse: {
        answer: parsedEnvelope.data.answer,
        memorySummaryStored: false,
        type: "final" as const,
      },
      pendingClientAction: null,
    };
  }

  return {
    pendingClientAction: {
      actionId: crypto.randomUUID(),
      args: parsedEnvelope.data.arguments,
      toolCallId: crypto.randomUUID(),
      toolName: parsedEnvelope.data.toolName,
      uiMessage: parsedEnvelope.data.uiMessage,
    },
  };
}

function parseAgentEnvelope(content: string) {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return null;
  }
}
