import { z } from "zod";

import { MAX_CHAT_USER_MESSAGE_LENGTH } from "@/ai/constants/chat.constants";

const nonNegativeIntSchema = z.coerce.number().int().nonnegative();
const positiveIntSchema = z.coerce.number().int().positive();
const nonNegativeNumberSchema = z.coerce.number().nonnegative();

const parameterKeySchema = z.enum([
  "buoyancy",
  "damping",
  "diffusion",
  "temperature",
]);

const chatEntropyAggregateSchema = z
  .object({
    finalDigestByteLength: nonNegativeIntSchema,
    finalDigestHex: z.string().min(1),
    finalPoolByteLength: nonNegativeIntSchema,
    frameCount: nonNegativeIntSchema,
    totalExternalEntropyBytesLength: nonNegativeIntSchema,
  })
  .strict();

const chatEntropyFrameSchema = z
  .object({
    digestHex: z.string().min(1),
    frameIndex: nonNegativeIntSchema,
    height: positiveIntSchema,
    rgbaByteLength: nonNegativeIntSchema,
    sourceHeight: positiveIntSchema,
    sourceWidth: positiveIntSchema,
    timingNoiseByteLength: nonNegativeIntSchema,
    totalTimingMs: nonNegativeNumberSchema,
    width: positiveIntSchema,
  })
  .strict();

export const chatEntropyContextSchema = z
  .object({
    aggregate: chatEntropyAggregateSchema,
    frames: z.array(chatEntropyFrameSchema).default([]),
  })
  .strict();

export const controlSimulationActionArgsSchema = z
  .discriminatedUnion("mode", [
    z
      .object({
        key: parameterKeySchema,
        mode: z.literal("absolute"),
        value: z.number().finite(),
      })
      .strict(),
    z
      .object({
        delta: z.number().finite(),
        key: parameterKeySchema,
        mode: z.literal("relative"),
      })
      .strict(),
  ])
  .transform((value) => ({
    ...value,
    kind: "set-simulation-parameter" as const,
  }));

export const runEntropyCaptureActionArgsSchema = z
  .object({
    frameCount: z.number().int().min(1).max(12),
  })
  .strict();

export const controlSimulationToolResultSchema = z
  .object({
    actionId: z.string().min(1),
    status: z.literal("completed"),
    toolName: z.literal("controlSimulation"),
  })
  .strict();

export const runEntropyCaptureToolResultSchema = z
  .object({
    actionId: z.string().min(1),
    status: z.literal("completed"),
    toolName: z.literal("runEntropyCapture"),
  })
  .strict();

export const submitChatInputSchema = z
  .object({
    entropyContext: chatEntropyContextSchema.nullish(),
    message: z.string().trim().min(1).max(MAX_CHAT_USER_MESSAGE_LENGTH),
  })
  .strict();

export const resumeChatInputSchema = z
  .object({
    actionId: z.string().min(1),
    entropyContext: chatEntropyContextSchema.nullish(),
    toolResult: z.union([
      controlSimulationToolResultSchema,
      runEntropyCaptureToolResultSchema,
    ]),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.actionId !== value.toolResult.actionId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The resume actionId must match the tool result actionId.",
        path: ["actionId"],
      });
    }
  });

export type SubmitChatInputSchema = z.infer<typeof submitChatInputSchema>;
export type ResumeChatInputSchema = z.infer<typeof resumeChatInputSchema>;
