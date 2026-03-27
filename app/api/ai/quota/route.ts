import { NextRequest, NextResponse } from "next/server";

import { getUserDailyQuota } from "@/lib/server/quota/quota";
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
