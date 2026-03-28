import type { ChatStateValue } from "../chat.state";

export function routeAfterAgent(state: ChatStateValue) {
  if (state.finalResponse) {
    return "persistMemory";
  }

  if (state.pendingClientAction) {
    return "finalize";
  }

  return "persistMemory";
}
