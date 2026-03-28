import "server-only";

import { MemorySaver } from "@langchain/langgraph";

let chatCheckpointer: MemorySaver | null = null;

export function getChatCheckpointer() {
  if (chatCheckpointer) {
    return chatCheckpointer;
  }

  chatCheckpointer = new MemorySaver();

  return chatCheckpointer;
}
