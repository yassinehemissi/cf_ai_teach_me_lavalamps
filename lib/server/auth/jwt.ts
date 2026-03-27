import "server-only";

import { sign, verify } from "jsonwebtoken";

import { getAuthEnvironment } from "./auth.config";

export type SessionClaims = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export async function createSessionToken(
  claims: SessionClaims,
): Promise<string> {
  return sign(claims, getAuthEnvironment().jwtSecret, {
    algorithm: "HS256",
  });
}

export async function verifySessionToken(
  token: string,
): Promise<SessionClaims | null> {
  try {
    const payload = verify(
      token,
      getAuthEnvironment().jwtSecret,
      { algorithms: ["HS256"] },
    ) as Partial<SessionClaims>;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload as SessionClaims;
  } catch {
    return null;
  }
}
