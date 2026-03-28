import { z } from "zod";

import {
  controlSimulationToolSchema,
  runEntropyCaptureToolSchema,
} from "../../tools/tool.schema";

export const finalAgentEnvelopeSchema = z
  .object({
    answer: z.string().trim().min(1),
    type: z.literal("final"),
  })
  .strict();

export const controlSimulationFunctionCallSchema = z
  .object({
    arguments: controlSimulationToolSchema,
    toolName: z.literal("controlSimulation"),
    type: z.literal("function_call"),
    uiMessage: z.string().trim().min(1).nullable(),
  })
  .strict();

export const runEntropyCaptureFunctionCallSchema = z
  .object({
    arguments: runEntropyCaptureToolSchema,
    toolName: z.literal("runEntropyCapture"),
    type: z.literal("function_call"),
    uiMessage: z.string().trim().min(1).nullable(),
  })
  .strict();

export const agentEnvelopeSchema = z.union([
  finalAgentEnvelopeSchema,
  controlSimulationFunctionCallSchema,
  runEntropyCaptureFunctionCallSchema,
]);
