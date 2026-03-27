import { hash } from "bcrypt";
import { NextResponse } from "next/server";

import {
  normalizeEmail,
  normalizePassword,
  validateCredentials,
} from "@/lib/server/auth/credentials";
import { setSessionCookie } from "@/lib/server/auth/session";
import { createUser, findUserByEmail } from "@/lib/server/auth/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);
    const validationError = validateCredentials(email, password);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account already exists for this email." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 10);
    const user = await createUser(email, passwordHash);
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });

    await setSessionCookie(response, {
      id: user.id,
      email: user.email,
    });

    return response;
  } catch (error) {
    console.error("Sign-up route failed.", error);

    return NextResponse.json(
      { error: getAuthErrorMessage(error) },
      { status: 500 },
    );
  }
}

function getAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to create account.";
}
