import "server-only";

import { AGENT_DAILY_USER_QUOTA_LIMIT } from "@/ai/server/constants/agent.constants";
import { d1Execute, d1Query } from "@/lib/server/auth/d1";

type QuotaRow = {
  max_quota: number | string;
  quota: number | string;
  reset_at: string;
  user_id: string;
};

export type UserQuotaState = {
  maxQuota: number;
  quota: number;
  remainingQuota: number;
  resetAtIso: string;
  userId: string;
};

export async function getUserDailyQuota(userId: string) {
  if (isQuotaDisabledInDevelopment()) {
    return getDevelopmentQuotaState(userId);
  }

  return getCurrentUserQuota(userId);
}

export async function ensureUserHasDailyQuota(userId: string) {
  if (isQuotaDisabledInDevelopment()) {
    return getDevelopmentQuotaState(userId);
  }

  const quota = await getCurrentUserQuota(userId);

  if (quota.quota >= quota.maxQuota) {
    throw new Error(
      `You have reached your ${quota.maxQuota}-message limit for today. Try again after ${quota.resetAtIso}.`,
    );
  }

  return quota;
}

export async function incrementUserDailyQuotaUsage(
  userId: string,
  usageCount: number,
) {
  if (isQuotaDisabledInDevelopment()) {
    return getDevelopmentQuotaState(userId);
  }

  if (!Number.isFinite(usageCount) || usageCount <= 0) {
    return getCurrentUserQuota(userId);
  }

  const quota = await getCurrentUserQuota(userId);
  const nextQuotaValue = Math.min(
    quota.maxQuota,
    quota.quota + Math.trunc(usageCount),
  );

  await d1Execute(
    `
      UPDATE quotas
      SET quota = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `,
    [String(nextQuotaValue), userId],
  );

  return {
    ...quota,
    quota: nextQuotaValue,
    remainingQuota: Math.max(0, quota.maxQuota - nextQuotaValue),
  } satisfies UserQuotaState;
}

async function getCurrentUserQuota(userId: string): Promise<UserQuotaState> {
  const now = new Date();
  const nextResetAt = getNextUtcReset(now);
  let row = await loadQuotaRow(userId);

  if (!row) {
    await createQuotaRow(userId, nextResetAt);
    row = await loadQuotaRow(userId);
  }

  if (!row) {
    throw new Error("The user quota row could not be created.");
  }

  const quota = toInteger(row.quota, 0);
  const maxQuota = AGENT_DAILY_USER_QUOTA_LIMIT;
  const resetAt = parseSqliteDateTime(row.reset_at);
  const isResetDue = resetAt.getTime() <= now.getTime();
  const shouldNormalizeLimit = toInteger(row.max_quota, maxQuota) !== maxQuota;

  if (isResetDue || shouldNormalizeLimit) {
    const normalizedResetAt = getNextUtcReset(now);
    const normalizedQuota = isResetDue ? 0 : quota;

    await d1Execute(
      `
        UPDATE quotas
        SET quota = ?, max_quota = ?, reset_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `,
      [
        String(normalizedQuota),
        String(maxQuota),
        toSqliteDateTime(normalizedResetAt),
        userId,
      ],
    );

    return {
      maxQuota,
      quota: normalizedQuota,
      remainingQuota: Math.max(0, maxQuota - normalizedQuota),
      resetAtIso: normalizedResetAt.toISOString(),
      userId,
    };
  }

  return {
    maxQuota,
    quota,
    remainingQuota: Math.max(0, maxQuota - quota),
    resetAtIso: resetAt.toISOString(),
    userId,
  };
}

async function loadQuotaRow(userId: string) {
  const rows = await d1Query<QuotaRow>(
    `
      SELECT user_id, quota, max_quota, reset_at
      FROM quotas
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ?? null;
}

async function createQuotaRow(userId: string, resetAt: Date) {
  await d1Execute(
    `
      INSERT INTO quotas (user_id, quota, max_quota, reset_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [
      userId,
      "0",
      String(AGENT_DAILY_USER_QUOTA_LIMIT),
      toSqliteDateTime(resetAt),
    ],
  );
}

function getNextUtcReset(now: Date) {
  const nextReset = new Date(now);

  nextReset.setUTCHours(24, 0, 0, 0);

  return nextReset;
}

function toSqliteDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function parseSqliteDateTime(value: string) {
  return new Date(value.replace(" ", "T") + "Z");
}

function toInteger(value: number | string, fallback: number) {
  const normalizedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
}

function isQuotaDisabledInDevelopment() {
  return process.env.NODE_ENV === "development";
}

function getDevelopmentQuotaState(userId: string): UserQuotaState {
  return {
    maxQuota: AGENT_DAILY_USER_QUOTA_LIMIT,
    quota: 0,
    remainingQuota: AGENT_DAILY_USER_QUOTA_LIMIT,
    resetAtIso: getNextUtcReset(new Date()).toISOString(),
    userId,
  };
}
