import "server-only";

import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";

import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

import { getChatCheckpointer } from "../checkpoint/checkpointer";
import { routeAfterAgent } from "./edges/routeAfterAgent";
import { ChatState } from "./chat.state";
import type {
  ChatClientToolResult,
  ChatServerResponse,
  ChatUserMetadata,
} from "./chat.types";
import { agent } from "./nodes/agent";
import { finalize } from "./nodes/finalize";
import { persistMemory } from "./nodes/persistMemory";
import { prepareContext } from "./nodes/prepareContext";
import { tools } from "./nodes/tools";

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
    pendingClientAction?: {
      actionId: string;
      toolCallId: string;
      toolName: string;
    } | null;
  };
  const pendingClientAction = stateValues.pendingClientAction;

  if (!pendingClientAction) {
    throw new Error("There is no pending client action to resume.");
  }

  if (pendingClientAction.actionId !== actionId) {
    throw new Error("The client action being resumed does not match the active thread state.");
  }

  const state = await getChatGraph().invoke(
    {
      entropyContext: entropyContext ?? null,
      finalResponse: null,
      memorySummaryStored: false,
      messages: [
        new ToolMessage({
          artifact: toolResult,
          content: JSON.stringify(toolResult),
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
    .addNode("tools", tools)
    .addNode("persistMemory", persistMemory)
    .addNode("finalize", finalize)
    .addEdge(START, "prepareContext")
    .addEdge("prepareContext", "agent")
    .addConditionalEdges("agent", routeAfterAgent, {
      finalize: "finalize",
      persistMemory: "persistMemory",
      tools: "tools",
    })
    .addEdge("tools", "finalize")
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
