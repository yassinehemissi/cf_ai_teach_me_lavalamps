import "server-only";

import { tool } from "@langchain/core/tools";

import { runEntropyCaptureToolSchema } from "./tool.schema";

export const runEntropyCaptureTool = tool(
  async (input) => JSON.stringify(input),
  {
    description:
      "Use this only when the user explicitly asks to run entropy extraction. It requests a client-side entropy capture run and later receives the result back.",
    name: "runEntropyCapture",
    schema: runEntropyCaptureToolSchema,
  },
);
