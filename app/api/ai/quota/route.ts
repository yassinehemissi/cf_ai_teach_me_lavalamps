import { NextRequest, NextResponse } from "next/server";

import {
  getUserDailyQuota,
  incrementUserDailyQuotaUsage,
} from "@/lib/server/quota/quota";
import { getSessionFromRequest } from "@/lib/server/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const quota = await getUserDailyQuota(session.sub);

    return NextResponse.json(quota);
  } catch (error) {
    console.error("AI quota read route failed.", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "AI quota read failed.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as { usageCount?: unknown };
    const usageCount = normalizeUsageCount(body.usageCount);

    if (usageCount <= 0) {
      return NextResponse.json(
        { error: "A positive usageCount is required." },
        { status: 400 },
      );
    }

    const quota = await incrementUserDailyQuotaUsage(session.sub, usageCount);

    return NextResponse.json(quota);
  } catch (error) {
    console.error("AI quota sync route failed.", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "AI quota sync failed.",
      },
      { status: 500 },
    );
  }
}

function normalizeUsageCount(usageCount: unknown) {
  if (typeof usageCount !== "number" || !Number.isFinite(usageCount)) {
    return 0;
  }

  return Math.max(0, Math.trunc(usageCount));
}
