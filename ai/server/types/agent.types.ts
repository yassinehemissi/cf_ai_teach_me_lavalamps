import "server-only";

import type { SimulationCommand } from "@/ai/types/command.types";
import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

export type AgentIntent =
  | "explain"
  | "control-simulation"
  | "run-entropy-worker";

export type AgentUserMetadata = {
  userEmail: string;
  userId: string;
};

export type AgentChatMessage = {
  content: string;
  role: "system" | "user" | "assistant";
};

export type AgentToolDescriptor = {
  description: string;
  title: string;
  usage: string;
  toolName: string;
};

export type AgentToolCall = {
  arguments: Record<string, unknown>;
  toolName: string;
};

export type AgentMemoryRecord = {
  id: string;
  summary: string;
  tags: string[];
  userId: string;
  writtenAtIso: string;
};

export type AgentResponsePayload = {
  answer: string;
  command: SimulationCommand | null;
  entropyContextUsed: boolean;
  intent: AgentIntent;
  memorySummaryStored: boolean;
  retrievedTools: AgentToolDescriptor[];
};

export type AgentChatRequest = {
  entropyContext?: ChatEntropyContext | null;
  messages: AgentChatMessage[];
};
