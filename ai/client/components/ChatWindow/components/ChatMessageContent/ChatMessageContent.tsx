"use client";

import { BlockMath, InlineMath } from "react-katex";

import { parseChatMessageContent } from "./ChatMessageContent.utils";

export function ChatMessageContent({
  content,
}: {
  content: string;
}) {
  const segments = parseChatMessageContent(content);

  return (
    <div className="space-y-3 whitespace-pre-wrap break-words">
      {segments.map((segment, index) => {
        if (segment.kind === "block-math") {
          return (
            <div key={`segment-${index}`} className="overflow-x-auto rounded-xl bg-stone-950/35 px-3 py-2">
              <BlockMath math={segment.value} />
            </div>
          );
        }

        if (segment.kind === "inline-math") {
          return (
            <InlineMath key={`segment-${index}`} math={segment.value} />
          );
        }

        return <span key={`segment-${index}`}>{segment.value}</span>;
      })}
    </div>
  );
}
