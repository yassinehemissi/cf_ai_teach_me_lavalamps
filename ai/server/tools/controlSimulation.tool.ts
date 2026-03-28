import "server-only";

import { tool } from "@langchain/core/tools";

import { controlSimulationToolSchema } from "./tool.schema";

export const controlSimulationTool = tool(
  async (input) => JSON.stringify(input),
  {
    description:
      "Use this only when the user explicitly asks to change the simulation. It requests a bounded client-side simulation parameter update.",
    name: "controlSimulation",
    schema: controlSimulationToolSchema,
  },
);
