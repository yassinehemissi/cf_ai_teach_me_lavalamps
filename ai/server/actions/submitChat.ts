"use server";

import { submitChatTurn } from "../chat/chat";
import { submitChatInputSchema } from "../chat/chat.schema";
import { ensureUserHasDailyQuota, incrementUserDailyQuotaUsage } from "@/lib/server/quota/quota";
import { getSessionFromCookies } from "@/lib/server/auth/session";

export async function submitChat(input: unknown) {
  const session = await getSessionFromCookies();

  if (!session) {
    throw new Error("Unauthorized.");
  }

  const parsedInput = submitChatInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error("The chat request body is invalid.");
  }

  await ensureUserHasDailyQuota(session.sub);

  const response = await submitChatTurn({
    entropyContext: parsedInput.data.entropyContext ?? null,
    message: parsedInput.data.message,
    user: {
      userEmail: session.email,
      userId: session.sub,
    },
  });

  await incrementUserDailyQuotaUsage(session.sub, 1);

  return response;
}
