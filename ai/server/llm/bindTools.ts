import "server-only";

import { createCloudflareWorkersAI } from "./cloudflareWorkersAi";

export function createAgentChatModel() {
  return createCloudflareWorkersAI();
}
