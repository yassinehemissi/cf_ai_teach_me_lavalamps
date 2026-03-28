import "server-only";

import { maybePersistConversationSummary } from "../../memory/memoryPolicy";
import type { ChatStateValue } from "../chat.state";

export async function persistMemory(state: ChatStateValue) {
  if (!state.user) {
    return {
      memorySummaryStored: false,
    };
  }

  const record = await maybePersistConversationSummary({
    messages: state.messages,
    user: state.user,
  });

  return {
    memorySummaryStored: record !== null,
  };
}
