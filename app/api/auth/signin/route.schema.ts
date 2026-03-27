import { z } from "zod";

export const signInRequestSchema = z
  .object({
    email: z.string(),
    password: z.string(),
  })
  .strict();

export type SignInRequest = z.infer<typeof signInRequestSchema>;
