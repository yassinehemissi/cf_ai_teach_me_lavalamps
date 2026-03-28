import type { ChatClientAction } from "@/ai/server/chat/chat.types";
import type { SimulationCommand } from "@/ai/types/command.types";
import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

type SimulationParameterCommand = Extract<
  SimulationCommand,
  { kind: "set-simulation-parameter" }
>;

export type ClientExecutorContext = {
  getEntropyContext?: () => ChatEntropyContext | null;
  onEntropyCommand?: (frameCount: number) => Promise<string | null>;
  onSimulationCommand?: (command: SimulationParameterCommand) => void;
};

export type ClientActionExecutor<TAction extends ChatClientAction> = (
  action: TAction,
  context: ClientExecutorContext,
) => Promise<{
  actionId: string;
  status: "completed";
  summary: string;
  toolName: TAction["toolName"];
}>;
