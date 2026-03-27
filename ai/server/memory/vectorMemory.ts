import "server-only";

import type { AI } from "cloudflare/resources/ai/ai";

import type { AgentMemoryRecord, AgentUserMetadata } from "../types/agent.types";
import { getAIEnvironment } from "../config/ai.config";
import { createCloudflareClient } from "../utils/cloudflareClient";

const MEMORY_EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
const MEMORY_QUERY_LIMIT = 5;

type StoredVectorRecord = {
  id?: string;
  metadata?: Record<string, unknown> | null;
  values?: number[] | null;
};

export async function appendMemorySummary(
  user: AgentUserMetadata,
  record: AgentMemoryRecord,
) {
  const environment = getAIEnvironment();
  const embedding = await embedText(record.summary);

  await upsertVectorRecords(environment.memoryVectorizeIndex, [
    {
      id: record.id,
      metadata: {
        summary: record.summary,
        tags: record.tags,
        type: "memory-summary",
        userId: user.userId,
        userEmail: user.userEmail,
        writtenAtIso: record.writtenAtIso,
      },
      values: embedding,
    },
  ]);
}

export async function loadRelevantMemory(
  user: AgentUserMetadata,
  query: string,
) {
  const environment = getAIEnvironment();
  const embedding = await embedText(query);
  const client = createCloudflareClient();
  const response = await client.vectorize.indexes.query(
    environment.memoryVectorizeIndex,
    {
      account_id: environment.accountId,
      returnMetadata: "all",
      topK: MEMORY_QUERY_LIMIT + 3,
      vector: embedding,
    } as never,
  );

  const matches =
    (response as { matches?: StoredVectorRecord[] } | null)?.matches ?? [];

  return matches
    .map((match) => toMemoryRecord(match))
    .filter(
      (record): record is AgentMemoryRecord =>
        record !== null && record.userId === user.userId,
    )
    .slice(0, MEMORY_QUERY_LIMIT);
}

export function createAgentMemoryRecord({
  summary,
  tags,
  user,
}: {
  summary: string;
  tags: string[];
  user: AgentUserMetadata;
}): AgentMemoryRecord {
  return {
    id: `${user.userId}:${Date.now()}`,
    summary,
    tags,
    userId: user.userId,
    writtenAtIso: new Date().toISOString(),
  };
}

async function embedText(text: string) {
  const client = createCloudflareClient();
  const environment = getAIEnvironment();
  const response = await client.ai.run(MEMORY_EMBEDDING_MODEL, {
    account_id: environment.accountId,
    text,
  } satisfies AI.AIRunParams);
  const embeddings = response as { data?: Array<Array<number>> };
  const vector = embeddings.data?.[0];

  if (!vector) {
    throw new Error("Vector memory embedding response was empty.");
  }

  return vector;
}

async function upsertVectorRecords(
  indexName: string,
  records: Array<{
    id: string;
    metadata: Record<string, unknown>;
    values: number[];
  }>,
) {
  const client = createCloudflareClient();
  const environment = getAIEnvironment();
  const payload = records.map((record) => JSON.stringify(record)).join("\n");

  await client.vectorize.indexes.upsert(indexName, {
    account_id: environment.accountId,
    body: new Blob([payload], { type: "application/x-ndjson" }),
  } as never);
}

function toMemoryRecord(record: StoredVectorRecord) {
  const metadata = toMetadataRecord(record.metadata);

  if (
    !metadata ||
    metadata.type !== "memory-summary" ||
    typeof metadata.summary !== "string" ||
    !Array.isArray(metadata.tags) ||
    typeof metadata.userId !== "string" ||
    typeof metadata.writtenAtIso !== "string"
  ) {
    return null;
  }

  return {
    id: typeof record.id === "string" ? record.id : `${metadata.userId}:${metadata.writtenAtIso}`,
    summary: metadata.summary,
    tags: metadata.tags.filter((tag): tag is string => typeof tag === "string"),
    userId: metadata.userId,
    writtenAtIso: metadata.writtenAtIso,
  } satisfies AgentMemoryRecord;
}

function toMetadataRecord(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  return metadata as Record<string, unknown>;
}
