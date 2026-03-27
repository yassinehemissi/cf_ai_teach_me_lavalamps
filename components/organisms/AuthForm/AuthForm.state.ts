"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import type { AuthFormState, AuthMode } from "./AuthForm.types";

const AUTH_COPY = {
  signin: {
    title: "Sign In",
    subtitle: "Access the simulation with your email and password.",
    submitLabel: "Enter Simulation",
    alternateHref: "/signup",
    alternateLabel: "Create an account",
  },
  signup: {
    title: "Create Account",
    subtitle: "Register with email and password only.",
    submitLabel: "Create Account",
    alternateHref: "/signin",
    alternateLabel: "Already have an account?",
  },
} as const;

export function useAuthFormState(mode: AuthMode): AuthFormState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = AUTH_COPY[mode];

  return useMemo(
    () => ({
      email,
      password,
      error,
      isSubmitting,
      title: copy.title,
      subtitle: copy.subtitle,
      submitLabel: copy.submitLabel,
      alternateHref: copy.alternateHref,
      alternateLabel: copy.alternateLabel,
      onEmailChange: setEmail,
      onPasswordChange: setPassword,
      onSubmit: async (event) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
          const response = await fetch(`/api/auth/${mode}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          });
          const payload = (await response.json()) as { error?: string };

          if (!response.ok) {
            setError(payload.error || "Authentication failed.");
            return;
          }

          const nextPath = searchParams.get("next");

          router.replace(isSafePath(nextPath) ? nextPath : "/simulation");
          router.refresh();
        } catch {
          setError("Authentication failed.");
        } finally {
          setIsSubmitting(false);
        }
      },
    }),
    [copy, email, error, isSubmitting, mode, password, router, searchParams],
  );
}

function isSafePath(path: string | null): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}
