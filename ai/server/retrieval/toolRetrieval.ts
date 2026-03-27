import "server-only";

import type { AI } from "cloudflare/resources/ai/ai";

import { AGENT_MAX_RETRIEVED_TOOLS } from "../constants/agent.constants";
import { getAIEnvironment } from "../config/ai.config";
import { AGENT_TOOL_CATALOG } from "../tools/toolCatalog";
import type { AgentToolDescriptor } from "../types/agent.types";
import { createCloudflareClient } from "../utils/cloudflareClient";

const TOOL_EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";

export async function retrieveRelevantTools(query: string) {
  const environment = getAIEnvironment();

  if (!environment.vectorizeEnabled || !environment.vectorizeIndex) {
    return lexicalToolSearch(query);
  }

  try {
    const embedding = await embedQuery(query);
    const client = createCloudflareClient();
    const response = await client.vectorize.indexes.query(
      environment.vectorizeIndex,
      {
        account_id: environment.accountId,
        topK: AGENT_MAX_RETRIEVED_TOOLS,
        returnMetadata: "all",
        vector: embedding,
      } as never,
    );

    const matches =
      (response as { matches?: Array<{ metadata?: Record<string, unknown> }> } | null)
        ?.matches ?? [];

    const tools = matches
      .map((match) => toToolDescriptor(match.metadata))
      .filter((tool): tool is AgentToolDescriptor => tool !== null);

    return tools.length > 0 ? tools : lexicalToolSearch(query);
  } catch {
    return lexicalToolSearch(query);
  }
}

async function embedQuery(query: string) {
  const client = createCloudflareClient();
  const environment = getAIEnvironment();
  const response = await client.ai.run(TOOL_EMBEDDING_MODEL, {
    account_id: environment.accountId,
    text: query,
  } satisfies AI.AIRunParams);

  const embeddings = response as { data?: Array<Array<number>> };
  const vector = embeddings.data?.[0];

  if (!vector) {
    throw new Error("Tool retrieval embedding response was empty.");
  }

  return vector;
}

function lexicalToolSearch(query: string) {
  const normalizedQuery = query.toLowerCase();

  return AGENT_TOOL_CATALOG.filter((tool) => {
    const haystack =
      `${tool.title} ${tool.description} ${tool.usage} ${tool.toolName}`.toLowerCase();

    return normalizedQuery
      .split(/\s+/)
      .some((word) => word.length > 2 && haystack.includes(word));
  }).slice(0, AGENT_MAX_RETRIEVED_TOOLS);
}

function toToolDescriptor(metadata?: Record<string, unknown>) {
  if (
    !metadata ||
    typeof metadata.description !== "string" ||
    typeof metadata.title !== "string" ||
    typeof metadata.toolName !== "string" ||
    typeof metadata.usage !== "string"
  ) {
    return null;
  }

  return {
    description: metadata.description,
    title: metadata.title,
    toolName: metadata.toolName,
    usage: metadata.usage,
  };
}

