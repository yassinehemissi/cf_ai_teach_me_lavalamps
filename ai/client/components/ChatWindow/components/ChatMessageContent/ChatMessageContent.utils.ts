import type { ChatMessageSegment } from "./ChatMessageContent.types";

const LATEX_TOKEN_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

export function parseChatMessageContent(content: string) {
  const segments: ChatMessageSegment[] = [];
  let cursor = 0;

  for (const match of content.matchAll(LATEX_TOKEN_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > cursor) {
      segments.push({
        kind: "text",
        value: content.slice(cursor, index),
      });
    }

    if (token.startsWith("$$") && token.endsWith("$$")) {
      segments.push({
        kind: "block-math",
        value: token.slice(2, -2).trim(),
      });
    } else {
      segments.push({
        kind: "inline-math",
        value: token.slice(1, -1).trim(),
      });
    }

    cursor = index + token.length;
  }

  if (cursor < content.length) {
    segments.push({
      kind: "text",
      value: content.slice(cursor),
    });
  }

  return segments.length > 0
    ? segments
    : [
        {
          kind: "text",
          value: content,
        },
      ];
}
