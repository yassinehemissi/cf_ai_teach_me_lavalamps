"use client";

import Link from "next/link";

import { useAuthFormState } from "./AuthForm.state";
import type { AuthFormProps } from "./AuthForm.types";

export function AuthForm({ mode }: AuthFormProps) {
  const state = useAuthFormState(mode);

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-stone-800/80 bg-stone-950/70 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
          Auth
        </p>
        <h1 className="font-mono text-3xl text-stone-100">{state.title}</h1>
        <p className="text-sm leading-6 text-stone-300">{state.subtitle}</p>
      </div>
      <form className="mt-8 space-y-5" onSubmit={state.onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm text-stone-300">Email</span>
          <input
            type="email"
            value={state.email}
            onChange={(event) => state.onEmailChange(event.target.value)}
            className="w-full rounded-2xl border border-stone-700 bg-stone-900/90 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-stone-300">Password</span>
          <input
            type="password"
            value={state.password}
            onChange={(event) => state.onPasswordChange(event.target.value)}
            className="w-full rounded-2xl border border-stone-700 bg-stone-900/90 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
            placeholder="Minimum 8 characters"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
          />
        </label>
        {state.error ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={state.isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-6 py-3 font-medium text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state.isSubmitting ? "Working..." : state.submitLabel}
        </button>
      </form>
      <div className="mt-6 text-sm text-stone-300">
        <Link href={state.alternateHref} className="text-amber-300 hover:text-amber-200">
          {state.alternateLabel}
        </Link>
      </div>
    </div>
  );
}
