import "server-only";

import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";

import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

import { getChatCheckpointer } from "../checkpoint/checkpointer";
import { routeAfterAgent } from "./edges/routeAfterAgent";
import { ChatState } from "./chat.state";
import type {
  ChatClientAction,
  ChatClientToolResult,
  ChatServerResponse,
  ChatUserMetadata,
} from "./chat.types";
import { agent } from "./nodes/agent";
import { finalize } from "./nodes/finalize";
import { parseFunctionCall } from "./nodes/parseFunctionCall";
import { persistMemory } from "./nodes/persistMemory";
import { prepareContext } from "./nodes/prepareContext";

let compiledChatGraph: ReturnType<typeof buildChatGraph> | null = null;

export function getChatGraph() {
  if (compiledChatGraph) {
    return compiledChatGraph;
  }

  compiledChatGraph = buildChatGraph();

  return compiledChatGraph;
}

export async function getChatGraphState(userId: string) {
  return getChatGraph().getState({
    configurable: {
      thread_id: userId,
    },
  });
}

export async function submitChatTurn({
  entropyContext,
  message,
  user,
}: {
  entropyContext?: ChatEntropyContext | null;
  message: string;
  user: ChatUserMetadata;
}) {
  const state = await getChatGraph().invoke(
    {
      entropyContext: entropyContext ?? null,
      finalResponse: null,
      memorySummaryStored: false,
      messages: [new HumanMessage(message)],
      pendingClientAction: null,
      user,
    },
    getThreadConfig(user.userId),
  );

  return getFinalResponse(state);
}

export async function resumeChatTurn({
  actionId,
  entropyContext,
  toolResult,
  user,
}: {
  actionId: string;
  entropyContext?: ChatEntropyContext | null;
  toolResult: ChatClientToolResult;
  user: ChatUserMetadata;
}) {
  const snapshot = await getChatGraphState(user.userId);
  const stateValues = snapshot.values as {
    pendingClientAction?: ChatClientAction | null;
  };
  const pendingClientAction = stateValues.pendingClientAction;

  if (!pendingClientAction) {
    throw new Error("There is no pending client action to resume.");
  }

  if (pendingClientAction.actionId !== actionId) {
    throw new Error("The client action being resumed does not match the active thread state.");
  }

  const canonicalToolResult = buildCanonicalToolResult({
    entropyContext: entropyContext ?? null,
    pendingClientAction,
    toolResult,
  });

  const state = await getChatGraph().invoke(
    {
      entropyContext: entropyContext ?? null,
      finalResponse: null,
      memorySummaryStored: false,
      messages: [
        new ToolMessage({
          artifact: canonicalToolResult,
          content: JSON.stringify(canonicalToolResult),
          name: pendingClientAction.toolName,
          status: "success",
          tool_call_id: pendingClientAction.toolCallId,
        }),
      ],
      pendingClientAction: null,
      user,
    },
    getThreadConfig(user.userId),
  );

  return getFinalResponse(state);
}

function buildChatGraph() {
  return new StateGraph(ChatState)
    .addNode("prepareContext", prepareContext)
    .addNode("agent", agent)
    .addNode("parseFunctionCall", parseFunctionCall)
    .addNode("persistMemory", persistMemory)
    .addNode("finalize", finalize)
    .addEdge(START, "prepareContext")
    .addEdge("prepareContext", "agent")
    .addEdge("agent", "parseFunctionCall")
    .addConditionalEdges("parseFunctionCall", routeAfterAgent, {
      persistMemory: "persistMemory",
      finalize: "finalize",
    })
    .addEdge("persistMemory", "finalize")
    .addEdge("finalize", END)
    .compile({
      checkpointer: getChatCheckpointer(),
      name: "chat",
    });
}

function getFinalResponse(state: { finalResponse?: ChatServerResponse | null }) {
  if (!state.finalResponse) {
    throw new Error("The chat graph completed without producing a final response.");
  }

  return state.finalResponse;
}

function getThreadConfig(userId: string) {
  return {
    configurable: {
      thread_id: userId,
    },
  };
}

function buildCanonicalToolResult({
  entropyContext,
  pendingClientAction,
  toolResult,
}: {
  entropyContext: ChatEntropyContext | null;
  pendingClientAction: ChatClientAction;
  toolResult: ChatClientToolResult;
}) {
  if (toolResult.toolName !== pendingClientAction.toolName) {
    throw new Error("The resumed tool result does not match the pending tool type.");
  }

  if (toolResult.status !== "completed") {
    throw new Error("Only completed client tool results are accepted.");
  }

  if (pendingClientAction.toolName === "controlSimulation") {
    return {
      actionId: pendingClientAction.actionId,
      command: pendingClientAction.args,
      status: "completed" as const,
      summary: buildSimulationSummary(pendingClientAction),
      toolName: "controlSimulation" as const,
    };
  }

  if (!entropyContext) {
    throw new Error("Entropy resume requires the latest entropy context.");
  }

  if (entropyContext.aggregate.frameCount !== pendingClientAction.args.frameCount) {
    throw new Error("The entropy context does not match the pending frame count.");
  }

  return {
    actionId: pendingClientAction.actionId,
    frameCount: pendingClientAction.args.frameCount,
    status: "completed" as const,
    summary: [
      `Entropy run completed for ${entropyContext.aggregate.frameCount} frame(s).`,
      `Final pool bytes: ${entropyContext.aggregate.finalPoolByteLength}.`,
      `Final SHA-256: ${entropyContext.aggregate.finalDigestHex}.`,
    ].join(" "),
    toolName: "runEntropyCapture" as const,
  };
}

function buildSimulationSummary(
  action: Extract<ChatClientAction, { toolName: "controlSimulation" }>,
) {
  if (action.args.mode === "absolute") {
    return `Set ${action.args.key} to ${action.args.value}.`;
  }

  return `Adjusted ${action.args.key} by ${action.args.delta}.`;
}
