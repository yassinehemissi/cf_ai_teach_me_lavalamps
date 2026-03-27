import type { SimulationCommand } from "@/ai/types/command.types";
import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";
import type {
  ChatIntent,
  ChatMessage,
  ChatResponsePayload,
} from "../../types/chat.types";

type SimulationParameterCommand = Extract<
  SimulationCommand,
  { kind: "set-simulation-parameter" }
>;

export type ChatWindowProps = {
  className?: string;
  getEntropyContext?: () => ChatEntropyContext | null;
  onEntropyCommand?: (frameCount: number) => Promise<string | null>;
  onSimulationCommand?: (command: SimulationParameterCommand) => void;
};

export type ChatWindowState = {
  error: string | null;
  entropyContextUsed: boolean;
  input: string;
  intent: ChatIntent | null;
  isSubmitting: boolean;
  isQuotaReady: boolean;
  memorySummaryStored: boolean;
  messagesLeft: number;
  messages: ChatMessage[];
  retrievedTools: ChatResponsePayload["retrievedTools"];
};
