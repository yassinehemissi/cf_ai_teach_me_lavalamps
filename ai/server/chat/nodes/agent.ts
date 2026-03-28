import "server-only";

import { SystemMessage } from "@langchain/core/messages";

import { createBoundChatModel } from "../../llm/bindTools";
import { CHAT_AGENT_SYSTEM_PROMPT } from "../../prompts/systemPrompt";
import type { ChatStateValue } from "../chat.state";

export async function agent(state: ChatStateValue) {
  const model = createBoundChatModel();
  const response = await model.invoke([
    new SystemMessage(buildSystemPrompt(state)),
    ...state.messages,
  ]);

  return {
    messages: [response],
  };
}

function buildSystemPrompt(state: ChatStateValue) {
  const sections = [CHAT_AGENT_SYSTEM_PROMPT];

  if (state.memoryContext) {
    sections.push(`User memory:\n${state.memoryContext}`);
  }

  if (state.entropyContext) {
    sections.push(
      [
        "Latest entropy context:",
        `Aggregate: ${JSON.stringify(state.entropyContext.aggregate)}`,
        ...state.entropyContext.frames.map(
          (frame) => `Frame: ${JSON.stringify(frame)}`,
        ),
      ].join("\n"),
    );
  }

  return sections.join("\n\n");
}
