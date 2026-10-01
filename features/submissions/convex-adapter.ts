import "server-only";
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
  const result = (await response.json()) as {
    success?: boolean;
    reference?: string;
    error?: string;
  };
  if (response.ok && result.success && typeof result.reference === "string")
    return {
      status: 200,
      data: {
        success: true,
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
  ];
  return {
    status: response.status >= 500 ? 503 : response.status,
    data: {
      success: false,
      error: allowed.includes(result.error ?? "")
        ? result.error
        : "SUBMISSION_FAILED",
    },
  };
}
