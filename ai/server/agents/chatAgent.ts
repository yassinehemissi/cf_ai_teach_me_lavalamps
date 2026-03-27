import "server-only";

import type { AI } from "cloudflare/resources/ai/ai";

import { AGENT_MAX_ATTEMPTS } from "../constants/agent.constants";
import { getAIEnvironment } from "../config/ai.config";
import {
  buildMemoryContext,
  buildPromptContext,
  loadUserMemory,
  maybePersistConversationSummary,
} from "../memory/memoryPolicy";
import {
  BASE_AGENT_SYSTEM_PROMPT,
  TOOL_SELECTION_SYSTEM_PROMPT,
} from "../prompts/systemPrompts";
import { retrieveRelevantTools } from "../retrieval/toolRetrieval";
import { buildSimulationCommand } from "../tools/controlSimulationTool";
import { buildEntropyCommand } from "../tools/runEntropyTool";
import type {
  AgentChatMessage,
  AgentIntent,
  AgentMemoryRecord,
  AgentResponsePayload,
  AgentToolDescriptor,
  AgentUserMetadata,
} from "../types/agent.types";
import { createCloudflareClient } from "../utils/cloudflareClient";
import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";

const AGENT_FAILURE_MESSAGE =
  "I could not complete the answer confidently after three attempts. Please provide more context or narrow the request.";

export async function runChatAgent({
  entropyContext,
  messages,
  user,
}: {
  entropyContext?: ChatEntropyContext | null;
  messages: AgentChatMessage[];
  user: AgentUserMetadata;
}): Promise<AgentResponsePayload> {
  const latestUserMessage = messages
    .slice()
    .reverse()
    .find((message) => message.role === "user")?.content;

  if (!latestUserMessage) {
    throw new Error("The chat request did not include a user message.");
  }

  const memorySummaryRecord = await maybePersistConversationSummary({
    messages,
    user,
  });
  const loadedMemoryRecords = await loadUserMemory(user, latestUserMessage);
  const memoryContext = buildMemoryContext(
    mergeMemoryRecords(loadedMemoryRecords, memorySummaryRecord),
  );

  const retrievedTools = await retrieveRelevantTools(latestUserMessage);
  const intent = inferIntent(latestUserMessage);
  const command =
    intent === "control-simulation"
      ? buildSimulationCommand(latestUserMessage)
      : intent === "run-entropy-worker"
      ? buildEntropyCommand(latestUserMessage)
      : null;

  const answer = await generateAgentAnswer({
    command,
    entropyContext,
    intent,
    memoryContext,
    messages,
    retrievedTools,
  });

  return {
    answer,
    command,
    entropyContextUsed: entropyContext !== null && entropyContext !== undefined,
    intent,
    memorySummaryStored: memorySummaryRecord !== null,
    retrievedTools,
  };
}

function mergeMemoryRecords(
  memoryRecords: AgentMemoryRecord[],
  latestRecord: AgentMemoryRecord | null,
) {
  if (!latestRecord) {
    return memoryRecords;
  }

  const existingIds = new Set(memoryRecords.map((record) => record.id));

  return existingIds.has(latestRecord.id)
    ? memoryRecords
    : [...memoryRecords, latestRecord];
}

async function generateAgentAnswer({
  command,
  entropyContext,
  intent,
  memoryContext,
  messages,
  retrievedTools,
}: {
  command: AgentResponsePayload["command"];
  entropyContext?: ChatEntropyContext | null;
  intent: AgentIntent;
  memoryContext: string;
  messages: AgentChatMessage[];
  retrievedTools: AgentToolDescriptor[];
}) {
  const prompt = [
    TOOL_SELECTION_SYSTEM_PROMPT,
    `Intent: ${intent}`,
    command
      ? `Selected command: ${JSON.stringify(command)}`
      : "Selected command: none",
    entropyContext ? formatEntropyContext(entropyContext) : "",
    memoryContext,
    "Relevant tools:",
    ...retrievedTools.map(
      (tool) =>
        `- ${tool.title} (${tool.toolName}): ${tool.description} Usage: ${tool.usage}`,
    ),
    "Conversation:",
    buildPromptContext(messages),
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    (await runTextInference({
      prompt,
      systemPrompt: BASE_AGENT_SYSTEM_PROMPT,
    })) ??
    AGENT_FAILURE_MESSAGE
  );
}

async function runTextInference({
  prompt,
  systemPrompt,
}: {
  prompt: string;
  systemPrompt: string;
}) {
  const client = createCloudflareClient();
  const environment = getAIEnvironment();

  for (let attempt = 1; attempt <= AGENT_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.ai.run(environment.model, {
        account_id: environment.accountId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      } satisfies AI.AIRunParams);
      const text = extractTextResponse(response);

      if (text) {
        return text;
      }
    } catch {
      if (attempt === AGENT_MAX_ATTEMPTS) {
        break;
      }
    }
  }

  return null;
}

function extractTextResponse(response: unknown) {
  if (
    response &&
    typeof response === "object" &&
    "response" in response &&
    typeof response.response === "string"
  ) {
    return response.response;
  }

  return null;
}

function formatEntropyContext(entropyContext: ChatEntropyContext) {
  return [
    "Latest entropy capture context:",
    `Aggregate: ${JSON.stringify(entropyContext.aggregate)}`,
    "Frames:",
    ...entropyContext.frames.map((frame) => JSON.stringify(frame)),
  ].join("\n");
}

function inferIntent(input: string): AgentIntent {
  const normalizedInput = input.toLowerCase();

  if (
    normalizedInput.includes("entropy") ||
    normalizedInput.includes("worker") ||
    normalizedInput.includes("digest")
  ) {
    return "run-entropy-worker";
  }

  if (
    normalizedInput.includes("increase") ||
    normalizedInput.includes("decrease") ||
    normalizedInput.includes("set ") ||
    normalizedInput.includes("change ")
  ) {
    return "control-simulation";
  }

  return "explain";
}
