import "server-only";

export const SESSION_COOKIE_NAME = "lava_lamp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthEnvironment = {
  accountId: string;
  databaseId: string;
  apiToken: string;
  jwtSecret: string;
  usersTable: string;
};

export function getAuthEnvironment(): AuthEnvironment {
  return {
    accountId: getRequiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    databaseId: getRequiredEnv("CLOUDFLARE_D1_DATABASE_ID"),
    apiToken: getRequiredEnv("CLOUDFLARE_D1_API_TOKEN"),
    jwtSecret: getRequiredEnv("AUTH_JWT_SECRET"),
    usersTable: getUsersTableName(),
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getUsersTableName(): string {
  const value = process.env.D1_AUTH_USERS_TABLE?.trim() || "users";

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error("D1_AUTH_USERS_TABLE must be a valid SQL identifier.");
  }

  return value;
}
