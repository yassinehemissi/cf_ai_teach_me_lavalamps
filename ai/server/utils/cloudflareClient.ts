import "server-only";

import Cloudflare from "cloudflare";

import { getAIEnvironment } from "../config/ai.config";

export function createCloudflareClient() {
  const environment = getAIEnvironment();

  return new Cloudflare({
    apiToken: environment.apiToken,
  });
}

