import type { SimulationCommand } from "@/ai/types/command.types";
import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  content: string;
  role: ChatRole;
};

export type ChatAgentToolDescriptor = {
  description: string;
  title: string;
  toolName: string;
  usage: string;
};

export type ChatIntent = "control-simulation" | "explain" | "run-entropy-worker";

export type ChatResponsePayload = {
  answer: string;
  command: SimulationCommand | null;
  entropyContextUsed: boolean;
  intent: ChatIntent;
  memorySummaryStored: boolean;
  retrievedTools: ChatAgentToolDescriptor[];
};

export type ChatRequestPayload = {
  entropyContext?: ChatEntropyContext | null;
  messages: ChatMessage[];
};
