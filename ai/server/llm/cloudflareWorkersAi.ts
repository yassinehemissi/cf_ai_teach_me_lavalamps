import "server-only";

import { ChatCloudflareWorkersAI } from "@langchain/cloudflare";

import { getAIEnvironment } from "../config/ai.config";

export function createCloudflareWorkersAI() {
  const environment = getAIEnvironment();

  return new ChatCloudflareWorkersAI({
    cloudflareAccountId: environment.accountId,
    cloudflareApiToken: environment.apiToken,
    model: environment.model,
  });
}
