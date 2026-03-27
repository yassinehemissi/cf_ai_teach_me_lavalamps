import { z } from "zod";

const chatMessageSchema = z
  .object({
    content: z.string(),
    role: z.enum(["assistant", "user"]),
  })
  .strict();

const chatEntropyAggregateSchema = z
  .object({
    finalDigestByteLength: z.number().int().nonnegative(),
    finalDigestHex: z.string().min(1),
    finalPoolByteLength: z.number().int().nonnegative(),
    frameCount: z.number().int().nonnegative(),
    totalExternalEntropyBytesLength: z.number().int().nonnegative(),
    totalLavaBytesLength: z.number().int().nonnegative(),
  })
  .strict();

const chatEntropyFrameSchema = z
  .object({
    digestHex: z.string().min(1),
    frameIndex: z.number().int().nonnegative(),
    height: z.number().int().positive(),
    rgbaByteLength: z.number().int().nonnegative(),
    sourceHeight: z.number().int().positive(),
    sourceWidth: z.number().int().positive(),
    timingNoiseByteLength: z.number().int().nonnegative(),
    totalTimingMs: z.number().nonnegative(),
    width: z.number().int().positive(),
  })
  .strict();

const chatEntropyContextSchema = z
  .object({
    aggregate: chatEntropyAggregateSchema,
    frames: z.array(chatEntropyFrameSchema),
  })
  .strict();

export const agentChatRequestSchema = z
  .object({
    entropyContext: chatEntropyContextSchema.nullish(),
    messages: z.array(chatMessageSchema).min(1),
  })
  .strict();

export type AgentChatRouteRequest = z.infer<typeof agentChatRequestSchema>;
