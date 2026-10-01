import { z } from "zod";

export const siteEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .url()
    .refine(
      (value) => /^https?:\/\//.test(value),
      "Site URL must use HTTP or HTTPS.",
    )
    .default("http://localhost:3000"),
});

export const submissionEnvSchema = z.object({
  CONVEX_SITE_URL: z.url().refine((value) => /^https?:\/\//.test(value)),
  CONVEX_SERVER_SECRET: z.string().min(32),
  TURNSTILE_SECRET_KEY: z.string().min(1),
});
