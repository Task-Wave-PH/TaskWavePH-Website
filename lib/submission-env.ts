import "server-only";
import { z } from "zod";
import { submissionEnvSchema } from "./env-schema";
export function submissionsEnabled() {
  return (
    process.env.SUBMISSIONS_ENABLED === "true" &&
    (process.env.NODE_ENV !== "production" ||
      process.env.PRIVACY_POLICY_APPROVED === "true")
  );
}
export function getSubmissionEnv() {
  const result = submissionEnvSchema.safeParse(process.env);
  if (!result.success)
    throw new Error("Submission backend configuration is incomplete.");
  if (
    process.env.NODE_ENV === "production" &&
    /^1x/.test(result.data.TURNSTILE_SECRET_KEY)
  )
    throw new Error("Turnstile test key is not allowed in production.");
  if (process.env.NODE_ENV === "production") {
    const privacy = z
      .object({
        PRIVACY_POLICY_APPROVED: z.literal("true"),
        PRIVACY_CONTACT_EMAIL: z.email(),
        PRIVACY_ORGANIZATION: z.string().min(2),
        PRIVACY_RETENTION_NOTICE: z.string().min(10),
      })
      .safeParse(process.env);
    if (!privacy.success)
      throw new Error(
        "Finalize production privacy configuration before enabling submissions.",
      );
  }
  return result.data;
}
