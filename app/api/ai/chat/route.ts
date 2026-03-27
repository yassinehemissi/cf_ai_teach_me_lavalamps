import { NextRequest, NextResponse } from "next/server";

import { runChatAgent } from "@/ai/server/agents/chatAgent";
import type {
  AgentChatMessage,
  AgentUserMetadata,
} from "@/ai/server/types/agent.types";
import { MAX_CHAT_USER_MESSAGE_LENGTH } from "@/ai/constants/chat.constants";
import {
  ensureUserHasDailyQuota,
  incrementUserDailyQuotaUsage,
} from "@/lib/server/quota/quota";
import { getSessionFromRequest } from "@/lib/server/auth/session";
import { agentChatRequestSchema } from "./route.schema";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const body = agentChatRequestSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        {
          error:
            "The chat request body is invalid. Only assistant/user messages and a valid entropyContext are allowed.",
        },
        { status: 400 },
      );
    }

    const messages = body.data.messages as AgentChatMessage[];
    const entropyContext = body.data.entropyContext ?? null;

    const latestUserMessage = getLatestUserMessage(messages);

    if (!latestUserMessage) {
      return NextResponse.json(
        { error: "The chat request did not include a user message." },
        { status: 400 },
      );
    }

    if (latestUserMessage.length > MAX_CHAT_USER_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          error: `Each user message is limited to ${MAX_CHAT_USER_MESSAGE_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    const user: AgentUserMetadata = {
      userEmail: session.email,
      userId: session.sub,
    };
    try {
      await ensureUserHasDailyQuota(user.userId);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "You have reached your message limit for today.",
        },
        { status: 429 },
      );
    }

    const result = await runChatAgent({
      entropyContext,
      messages,
      user,
    });

    await incrementUserDailyQuotaUsage(user.userId, 1);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI chat route failed.", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "AI chat request failed.",
      },
      { status: 500 },
    );
  }
}

function getLatestUserMessage(messages: AgentChatMessage[]) {
  return messages
    .slice()
    .reverse()
    .find((message) => message.role === "user")?.content;
}
