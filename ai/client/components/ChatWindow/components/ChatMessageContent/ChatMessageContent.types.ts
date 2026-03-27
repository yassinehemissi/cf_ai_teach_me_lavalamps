export type ChatMessageSegment =
  | {
      kind: "text";
      value: string;
    }
  | {
      kind: "inline-math";
      value: string;
    }
  | {
      kind: "block-math";
      value: string;
    };
