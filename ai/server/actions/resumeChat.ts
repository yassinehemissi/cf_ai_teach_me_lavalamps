"use server";

import { resumeChatTurn } from "../chat/chat";
import { resumeChatInputSchema } from "../chat/chat.schema";
import { getSessionFromCookies } from "@/lib/server/auth/session";

export async function resumeChat(input: unknown) {
  const session = await getSessionFromCookies();

  if (!session) {
    throw new Error("Unauthorized.");
  }

  const parsedInput = resumeChatInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error("The chat resume payload is invalid.");
  }

  return resumeChatTurn({
    actionId: parsedInput.data.actionId,
    entropyContext: parsedInput.data.entropyContext ?? null,
    toolResult: parsedInput.data.toolResult,
    user: {
      userEmail: session.email,
      userId: session.sub,
    },
  });
}
