import { NextRequest, NextResponse } from "next/server";

import { runChatAgent } from "@/ai/server/agents/chatAgent";
import type {
  AgentChatMessage,
  AgentChatRequest,
  AgentUserMetadata,
} from "@/ai/server/types/agent.types";
import type { ChatEntropyContext } from "@/ai/types/entropyContext.types";
import { MAX_CHAT_USER_MESSAGE_LENGTH } from "@/ai/constants/chat.constants";
import { ensureUserHasDailyQuota } from "@/lib/server/quota/quota";
import { getSessionFromRequest } from "@/lib/server/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Partial<AgentChatRequest>;
    const messages = normalizeMessages(body.messages);
    const entropyContext = normalizeEntropyContext(body.entropyContext);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "At least one chat message is required." },
        { status: 400 },
      );
    }

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

function normalizeMessages(messages: AgentChatMessage[] | undefined) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.filter(
    (message) =>
      message &&
      typeof message.content === "string" &&
      typeof message.role === "string" &&
      ["assistant", "system", "user"].includes(message.role),
  );
}

function getLatestUserMessage(messages: AgentChatMessage[]) {
  return messages
    .slice()
    .reverse()
    .find((message) => message.role === "user")?.content;
}

function normalizeEntropyContext(
  entropyContext: ChatEntropyContext | null | undefined,
) {
  if (
    !entropyContext ||
    typeof entropyContext !== "object" ||
    !entropyContext.aggregate ||
    !Array.isArray(entropyContext.frames)
  ) {
    return null;
  }

  const { aggregate, frames } = entropyContext;

  if (
    typeof aggregate.finalDigestHex !== "string" ||
    typeof aggregate.finalDigestByteLength !== "number" ||
    typeof aggregate.finalPoolByteLength !== "number" ||
    typeof aggregate.frameCount !== "number" ||
    typeof aggregate.totalExternalEntropyBytesLength !== "number" ||
    typeof aggregate.totalLavaBytesLength !== "number"
  ) {
    return null;
  }

  const normalizedFrames = frames.filter(
    (frame) =>
      frame &&
      typeof frame.digestHex === "string" &&
      typeof frame.frameIndex === "number" &&
      typeof frame.height === "number" &&
      typeof frame.rgbaByteLength === "number" &&
      typeof frame.sourceHeight === "number" &&
      typeof frame.sourceWidth === "number" &&
      typeof frame.timingNoiseByteLength === "number" &&
      typeof frame.totalTimingMs === "number" &&
      typeof frame.width === "number",
  );

  return {
    aggregate,
    frames: normalizedFrames,
  };
}
