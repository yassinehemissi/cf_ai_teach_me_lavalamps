import "server-only";

import {
  AGENT_DEFAULT_MODEL,
  AGENT_DEFAULT_TOOL_NAMESPACE,
} from "../constants/agent.constants";

export type AIEnvironment = {
  accountId: string;
  apiToken: string;
  knowledgeVectorizeIndex: string;
  memoryVectorizeIndex: string;
  model: string;
  toolNamespace: string;
  vectorizeIndex?: string;
  vectorizeEnabled: boolean;
};

export function getAIEnvironment(): AIEnvironment {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const apiToken = getRequiredEnv("CLOUDFLARE_D1_API_TOKEN");
  const memoryVectorizeIndex = getRequiredEnv("CLOUDFLARE_VECTORIZE_MEMORY_INDEX");
  const knowledgeVectorizeIndex = getRequiredEnv("CLOUDFLARE_VECTORIZE_KNOWLEDGE_INDEX");
  const vectorizeIndex = process.env.CLOUDFLARE_VECTORIZE_TOOL_INDEX?.trim();

  return {
    accountId,
    apiToken,
    knowledgeVectorizeIndex,
    memoryVectorizeIndex,
    model: process.env.CLOUDFLARE_AI_MODEL?.trim() || AGENT_DEFAULT_MODEL,
    toolNamespace:
      process.env.CLOUDFLARE_AI_TOOL_NAMESPACE?.trim() ||
      AGENT_DEFAULT_TOOL_NAMESPACE,
    vectorizeEnabled: Boolean(vectorizeIndex),
    vectorizeIndex: vectorizeIndex || undefined,
  };
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
