import "server-only";

import { AIMessage, SystemMessage } from "@langchain/core/messages";

import { invokeCloudflareWorkersAI } from "../../llm/cloudflareWorkersAi";
import { CHAT_AGENT_SYSTEM_PROMPT } from "../../prompts/systemPrompt";
import type { ChatStateValue } from "../chat.state";

export async function agent(state: ChatStateValue) {
  const responseText = await invokeCloudflareWorkersAI([
    new SystemMessage(buildSystemPrompt(state)),
    ...state.messages,
  ]);

  return {
    messages: [new AIMessage(responseText)],
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
