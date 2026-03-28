import type {
  ChatClientAction,
  ChatClientToolResult,
  ChatServerResponse,
} from "@/ai/server/chat/chat.types";
import type { SimulationCommand } from "@/ai/types/command.types";
import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

type SimulationParameterCommand = Extract<
  SimulationCommand,
  { kind: "set-simulation-parameter" }
>;

export type ChatBridgeQuota = {
  quota: number;
  remainingQuota: number;
  resetAtIso: string;
};

export type ChatBridgeClientExecutorContext = {
  getEntropyContext?: () => ChatEntropyContext | null;
  onEntropyCommand?: (frameCount: number) => Promise<string | null>;
  onSimulationCommand?: (command: SimulationParameterCommand) => void;
};

export type ChatBridgeRunResult = Extract<
  ChatServerResponse,
  { type: "final" }
>;

export type ExecuteClientAction = (
  action: ChatClientAction,
  context: ChatBridgeClientExecutorContext,
) => Promise<ChatClientToolResult>;
