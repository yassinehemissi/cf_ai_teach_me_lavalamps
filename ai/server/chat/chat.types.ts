import type { SimulationCommand } from "@/ai/types/command.types";
import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

export type ChatUserMetadata = {
  userEmail: string;
  userId: string;
};

export type ChatMemoryRecord = {
  id: string;
  summary: string;
  tags: string[];
  userId: string;
  writtenAtIso: string;
};

export type ControlSimulationClientAction = {
  actionId: string;
  args: Extract<SimulationCommand, { kind: "set-simulation-parameter" }>;
  toolCallId: string;
  toolName: "controlSimulation";
  uiMessage: string | null;
};

export type RunEntropyCaptureClientAction = {
  actionId: string;
  args: {
    frameCount: number;
  };
  toolCallId: string;
  toolName: "runEntropyCapture";
  uiMessage: string | null;
};

export type ChatClientAction =
  | ControlSimulationClientAction
  | RunEntropyCaptureClientAction;

export type ControlSimulationToolResult = {
  actionId: string;
  command: Extract<SimulationCommand, { kind: "set-simulation-parameter" }>;
  status: "completed";
  summary: string;
  toolName: "controlSimulation";
};

export type RunEntropyCaptureToolResult = {
  actionId: string;
  frameCount: number;
  status: "completed";
  summary: string;
  toolName: "runEntropyCapture";
};

export type ChatClientToolResult =
  | ControlSimulationToolResult
  | RunEntropyCaptureToolResult;

export type ChatServerResponse =
  | {
      answer: string;
      memorySummaryStored: boolean;
      type: "final";
    }
  | {
      action: ChatClientAction;
      answer: string | null;
      memorySummaryStored: boolean;
      type: "client-action";
    };

export type SubmitChatInput = {
  entropyContext?: ChatEntropyContext | null;
  message: string;
};

export type ResumeChatInput = {
  actionId: string;
  entropyContext?: ChatEntropyContext | null;
  toolResult: ChatClientToolResult;
};
