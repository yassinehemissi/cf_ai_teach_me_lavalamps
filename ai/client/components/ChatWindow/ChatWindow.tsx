"use client";

import type { KeyboardEvent } from "react";

import { ChatMessageContent } from "./components/ChatMessageContent/ChatMessageContent";
import { useChatWindowState } from "./ChatWindow.state";
import type { ChatWindowProps } from "./ChatWindow.types";
import {
  MAX_DAILY_CHAT_MESSAGES,
  MAX_CHAT_USER_MESSAGE_LENGTH,
} from "@/ai/constants/chat.constants";

export function ChatWindow({
  className,
  getEntropyContext,
  onEntropyCommand,
  onSimulationCommand,
}: ChatWindowProps) {
  const state = useChatWindowState({
    getEntropyContext,
    onEntropyCommand,
    onSimulationCommand,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void state.submit();
    }
  };

  return (
    <section
      className={`fixed bottom-6 right-6 z-50 flex h-[min(72vh,720px)] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-stone-700/80 bg-stone-950/95 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur ${className ?? ""}`}
    >
      <header className="border-b border-stone-800 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-500">
          Agent Chat
        </p>
        <h2 className="mt-2 text-lg text-stone-100">Lava Lamp Assistant</h2>
        <p className="mt-2 text-sm text-stone-300">
          Explain physics, suggest bounded controls, or interpret entropy results.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {state.messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "ml-8 bg-amber-500 text-stone-950"
                : "mr-8 border border-stone-800 bg-stone-900/80 text-stone-200"
            }`}
          >
            <ChatMessageContent content={message.content} />
          </div>
        ))}

        {state.error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </div>
        ) : null}

        {state.intent || state.retrievedTools.length > 0 ? (
          <div className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3 text-xs text-stone-300">
            <p className="uppercase tracking-[0.25em] text-stone-500">
              Agent State
            </p>
            {state.intent ? (
              <p className="mt-3">Intent: {state.intent}</p>
            ) : null}
            {state.memorySummaryStored ? (
              <p className="mt-2">Memory summary stored for this user.</p>
            ) : null}
            {state.entropyContextUsed ? (
              <p className="mt-2">Latest entropy capture context was included.</p>
            ) : null}
            {state.retrievedTools.length > 0 ? (
              <div className="mt-3 space-y-2">
                {state.retrievedTools.map((tool) => (
                  <p key={tool.toolName}>
                    {tool.title}: {tool.usage}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-stone-800 px-5 py-4">
        <textarea
          value={state.input}
          onChange={(event) => {
            state.setInput(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the simulation, controls, or entropy output..."
          className="h-28 w-full resize-none rounded-2xl border border-stone-700 bg-stone-900/90 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-400"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
          <span>Per-message limit: {MAX_CHAT_USER_MESSAGE_LENGTH} characters</span>
          <span>
            {state.input.trim().length}/{MAX_CHAT_USER_MESSAGE_LENGTH}
          </span>
        </div>
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-stone-500">
            <span>Messages Left</span>
            <span>
              {state.messagesLeft}/{MAX_DAILY_CHAT_MESSAGES}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full rounded-full bg-amber-400 transition-[width] duration-300"
              style={{
                width: `${(state.messagesLeft / MAX_DAILY_CHAT_MESSAGES) * 100}%`,
              }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void state.submit();
          }}
          disabled={
            !state.isQuotaReady ||
            state.isSubmitting ||
            state.messagesLeft <= 0 ||
            state.input.trim().length === 0 ||
            state.input.trim().length > MAX_CHAT_USER_MESSAGE_LENGTH
          }
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.isSubmitting
            ? "Thinking..."
            : !state.isQuotaReady
            ? "Loading quota..."
            : "Send"}
        </button>
      </div>
    </section>
  );
}
