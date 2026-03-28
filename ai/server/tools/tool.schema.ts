import { z } from "zod";

export const controlSimulationToolSchema = z
  .discriminatedUnion("mode", [
    z
      .object({
        key: z.enum(["buoyancy", "damping", "diffusion", "temperature"]),
        mode: z.literal("absolute"),
        value: z.number().finite(),
      })
      .strict(),
    z
      .object({
        delta: z.number().finite(),
        key: z.enum(["buoyancy", "damping", "diffusion", "temperature"]),
        mode: z.literal("relative"),
      })
      .strict(),
  ])
  .describe(
    "Apply a bounded simulation parameter update for buoyancy, damping, diffusion, or temperature.",
  );

export const runEntropyCaptureToolSchema = z
  .object({
    frameCount: z
      .number()
      .int()
      .min(1)
      .max(12)
      .describe("The number of simulation frames to capture for entropy extraction."),
  })
  .strict();
