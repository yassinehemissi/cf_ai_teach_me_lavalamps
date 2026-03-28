import "server-only";

import type { BaseMessage } from "@langchain/core/messages";
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

export async function invokeCloudflareWorkersAI(messages: BaseMessage[]) {
  const model = createCloudflareWorkersAI();
  const requestModel = model as unknown as {
    _request: (
      messages: BaseMessage[],
      options: { signal?: AbortSignal },
      stream?: boolean,
    ) => Promise<Response>;
  };
  const response = await requestModel._request(messages, {}, false);
  const payload = (await response.json()) as {
    response?: unknown;
    result?: {
      content?: unknown;
      output?: unknown;
      response?: unknown;
    };
  };
  const output =
    payload.result?.response ??
    payload.result?.content ??
    payload.result?.output ??
    payload.response;
  const text = extractCloudflareText(output);

  if (!text) {
    throw new Error("Cloudflare Workers AI returned an empty or unsupported chat response shape.");
  }

  return text;
}

function extractCloudflareText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => extractCloudflareText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;

  if (typeof record.text === "string") {
    return record.text.trim();
  }

  if (typeof record.content === "string") {
    return record.content.trim();
  }

  if (typeof record.response === "string") {
    return record.response.trim();
  }

  if (
    typeof record.type === "string" &&
    (typeof record.answer === "string" || typeof record.toolName === "string")
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(record.content)) {
    return extractCloudflareText(record.content);
  }

  if (Array.isArray(record.output)) {
    return extractCloudflareText(record.output);
  }

  return JSON.stringify(value);
}
