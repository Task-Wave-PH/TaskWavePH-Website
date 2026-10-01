import "server-only";
import { z } from "zod";
import { getSubmissionEnv } from "@/lib/submission-env";
export async function appendSubmission(payload: FormData, rateKey: string) {
  const env = getSubmissionEnv();
  const response = await fetch(`${env.CONVEX_SITE_URL}/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CONVEX_SERVER_SECRET}`,
      "x-rate-key": rateKey,
    },
    body: payload,
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  const result = z
    .object({
      success: z.boolean().optional(),
      reference: z.string().max(300).optional(),
      error: z.string().optional(),
      retryAfterSeconds: z.number().int().min(1).max(3600).optional(),
    })
    .parse(await response.json());
  if (response.ok && result.success && typeof result.reference === "string")
    return {
      status: 200,
      data: {
        success: true,
        retryAfterSeconds: undefined,
        ...(payload.get("kind") === "businessLeads"
          ? { leadId: result.reference }
          : { applicationId: result.reference }),
      },
    };
  const allowed = [
    "RATE_LIMITED",
    "SUBMISSION_IN_PROGRESS",
    "TOKEN_CONFLICT",
    "INVALID_SUBMISSION",
    "JOB_UNAVAILABLE",
  ];
  return {
    status: response.ok || response.status >= 500 ? 503 : response.status,
    data: {
      success: false,
      retryAfterSeconds:
        result.error === "RATE_LIMITED"
          ? (result.retryAfterSeconds ?? 60)
          : undefined,
      error: allowed.includes(result.error ?? "")
        ? result.error
        : "SUBMISSION_FAILED",
    },
  };
}

export async function checkSubmissionAttempt(rateKey: string) {
  const env = getSubmissionEnv();
  const response = await fetch(`${env.CONVEX_SITE_URL}/submission-attempt`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CONVEX_SERVER_SECRET}`,
      "x-rate-key": rateKey,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  const result = z
    .object({
      allowed: z.boolean().optional(),
      error: z.string().optional(),
      retryAfterSeconds: z.number().int().min(0).max(3600),
    })
    .parse(await response.json());
  if (response.ok && result.allowed === true)
    return { allowed: true, retryAfterSeconds: 0 };
  if (
    response.status === 429 &&
    result.error === "RATE_LIMITED" &&
    result.retryAfterSeconds > 0
  )
    return { allowed: false, retryAfterSeconds: result.retryAfterSeconds };
  throw new Error("Attempt limiter unavailable");
}
