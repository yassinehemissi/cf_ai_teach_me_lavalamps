import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "./auth.config";
import { createSessionToken, verifySessionToken, type SessionClaims } from "./jwt";

export async function setSessionCookie(
  response: NextResponse,
  user: { id: number; email: string },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = await createSessionToken({
    sub: String(user.id),
    email: user.email,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<SessionClaims | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
