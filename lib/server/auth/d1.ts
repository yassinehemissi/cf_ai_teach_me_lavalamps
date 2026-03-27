import "server-only";

import Cloudflare from "cloudflare";

import { getAuthEnvironment } from "./auth.config";

type D1QueryRow = Record<string, unknown>;
type D1QueryResult<T extends D1QueryRow> = {
  meta?: {
    last_row_id?: number;
  };
  results?: T[];
  success?: boolean;
};

let cloudflareClient: Cloudflare | null = null;

export async function d1Query<T extends D1QueryRow>(
  sql: string,
  params: string[] = [],
): Promise<T[]> {
  const result = await executeD1Query<T>(sql, params);

  return result.results ?? [];
}

export async function d1Execute(
  sql: string,
  params: string[] = [],
): Promise<{ lastRowId?: number }> {
  const result = await executeD1Query<Record<string, never>>(sql, params);

  return {
    lastRowId: result.meta?.last_row_id,
  };
}

async function executeD1Query<T extends D1QueryRow>(
  sql: string,
  params: string[],
): Promise<D1QueryResult<T>> {
  const environment = getAuthEnvironment();

  try {
    const page = await getCloudflareClient().d1.database.query(
      environment.databaseId,
      {
        account_id: environment.accountId,
        sql,
        params,
      },
    );
    const result = page.getPaginatedItems()[0] as D1QueryResult<T> | undefined;

    if (!result || result.success === false) {
      console.error("D1 query result failed.", {
        sql,
        params,
        result,
      });

      throw new Error("D1 query returned an unsuccessful result.");
    }

    return result;
  } catch (error) {
    console.error("D1 query execution threw.", {
      sql,
      params,
      error,
    });

    throw error;
  }
}

function getCloudflareClient(): Cloudflare {
  if (cloudflareClient) {
    return cloudflareClient;
  }

  const environment = getAuthEnvironment();
  cloudflareClient = new Cloudflare({
    apiToken: environment.apiToken,
  });

  return cloudflareClient;
}
