import { z } from "zod";

export const signUpRequestSchema = z
  .object({
    email: z.string(),
    password: z.string(),
  })
  .strict();

export type SignUpRequest = z.infer<typeof signUpRequestSchema>;
