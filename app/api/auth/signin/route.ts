import { compare } from "bcrypt";
import { NextResponse } from "next/server";

import {
  normalizeEmail,
  normalizePassword,
  validateCredentials,
} from "@/lib/server/auth/credentials";
import { setSessionCookie } from "@/lib/server/auth/session";
import { findUserByEmail } from "@/lib/server/auth/users";
import { signInRequestSchema } from "./route.schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = signInRequestSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        { error: "The request body must include only email and password." },
        { status: 400 },
      );
    }

    const email = normalizeEmail(body.data.email);
    const password = normalizePassword(body.data.password);
    const validationError = validateCredentials(email, password);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const isValidPassword = await compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

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
    console.error("Sign-in route failed.", error);

    return NextResponse.json(
      { error: getAuthErrorMessage(error) },
      { status: 500 },
    );
  }
}

function getAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to sign in.";
}
