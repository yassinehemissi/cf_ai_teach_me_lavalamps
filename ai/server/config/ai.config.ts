import "server-only";

import {
  AGENT_DEFAULT_MODEL,
} from "../constants/agent.constants";

export type AIEnvironment = {
  accountId: string;
  apiToken: string;
  memoryVectorizeIndex: string;
  model: string;
};

export function getAIEnvironment(): AIEnvironment {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const apiToken =
    process.env.CLOUDFLARE_API_TOKEN?.trim() ||
    getRequiredEnv("CLOUDFLARE_D1_API_TOKEN");
  const memoryVectorizeIndex = getRequiredEnv("CLOUDFLARE_VECTORIZE_MEMORY_INDEX");

  return {
    accountId,
    apiToken,
    memoryVectorizeIndex,
    model: process.env.CLOUDFLARE_AI_MODEL?.trim() || AGENT_DEFAULT_MODEL,
  };
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
