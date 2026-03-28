import type { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

import type {
  ChatClientAction,
  ChatServerResponse,
  ChatUserMetadata,
} from "./chat.types";

export const ChatState = Annotation.Root({
  entropyContext: Annotation<ChatEntropyContext | null>({
    default: () => null,
    reducer: (_currentValue, nextValue) => nextValue ?? null,
  }),
  finalResponse: Annotation<ChatServerResponse | null>({
    default: () => null,
    reducer: (_currentValue, nextValue) => nextValue ?? null,
  }),
  memoryContext: Annotation<string>({
    default: () => "",
    reducer: (_currentValue, nextValue) => nextValue ?? "",
  }),
  memorySummaryStored: Annotation<boolean>({
    default: () => false,
    reducer: (_currentValue, nextValue) => nextValue ?? false,
  }),
  messages: Annotation<BaseMessage[]>({
    default: () => [],
    reducer: messagesStateReducer,
  }),
  pendingClientAction: Annotation<ChatClientAction | null>({
    default: () => null,
    reducer: (_currentValue, nextValue) => nextValue ?? null,
  }),
  user: Annotation<ChatUserMetadata | null>({
    default: () => null,
    reducer: (_currentValue, nextValue) => nextValue ?? null,
  }),
});

export type ChatStateValue = typeof ChatState.State;
