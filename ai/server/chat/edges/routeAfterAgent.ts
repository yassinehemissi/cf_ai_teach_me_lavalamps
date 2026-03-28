import { isAIMessage } from "@langchain/core/messages";

import type { ChatStateValue } from "../chat.state";

export function routeAfterAgent(state: ChatStateValue) {
  if (state.finalResponse) {
    return "finalize";
  }

  const lastMessage = state.messages[state.messages.length - 1];

  if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length) {
    return "tools";
  }

  return "persistMemory";
}
