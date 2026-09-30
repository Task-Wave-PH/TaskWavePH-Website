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

export const googleEnvSchema = z.object({
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().trim().min(1),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.email(),
  GOOGLE_PRIVATE_KEY: z
    .string()
    .min(1)
    .transform((value) => value.replace(/\\n/g, "\n"))
    .refine(
      (value) =>
        value.includes("-----BEGIN PRIVATE KEY-----") &&
        value.includes("-----END PRIVATE KEY-----"),
      "Expected a PEM private key.",
    ),
});

export function parseGoogleEnv(input: Record<string, string | undefined>) {
  const result = googleEnvSchema.safeParse(input);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path[0])),
    ];
    throw new Error(
      `Missing or invalid Google configuration: ${fields.join(", ")}`,
    );
  }
  return result.data;
}
