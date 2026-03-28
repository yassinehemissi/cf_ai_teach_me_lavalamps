import type { BaseMessage } from "@langchain/core/messages";

export function extractMessageText(message: BaseMessage | undefined | null) {
  if (!message) {
    return "";
  }

  if (typeof message.content === "string") {
    return message.content.trim();
  }

  if (!Array.isArray(message.content)) {
    return "";
  }

  return message.content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (
        part &&
        typeof part === "object" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }

      return "";
    })
    .join("\n")
    .trim();
}

export function getLatestUserMessageText(messages: BaseMessage[]) {
  return [...messages]
    .reverse()
    .find((message) => message._getType() === "human");
}

export function toMemorySummaryLines(messages: BaseMessage[]) {
  return messages.slice(-8).map((message) => {
    const type = message._getType();
    const role =
      type === "human"
        ? "user"
        : type === "ai"
        ? "assistant"
        : type === "tool"
        ? "tool"
        : "system";
    const content = extractMessageText(message);
    const clippedContent =
      content.length > 180 ? `${content.slice(0, 177)}...` : content;

    return `${role}: ${clippedContent}`;
  });
}
