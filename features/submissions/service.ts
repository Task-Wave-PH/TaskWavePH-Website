import "server-only";
import { NextResponse } from "next/server";
import { confirmationRoutes, createReceipt, RECEIPT_MAX_AGE } from "./receipt";
import { applicationSchema } from "@/features/applications/schema";
import { leadSchema } from "@/features/leads/schema";
import { getSubmissionEnv, submissionsEnabled } from "@/lib/submission-env";
import {
  MAX_REQUEST_BYTES,
  submissionTokenSchema,
  validateResume,
} from "./validation";
import { appendSubmission, checkSubmissionAttempt } from "./convex-adapter";
import { submissionRateKey } from "./rate-key";
import { readSubmissionBody, SubmissionBodyError } from "./request-body";

export async function submitRequest(
  request: Request,
  kind: "applications" | "businessLeads",
) {
  const json = (data: object, status: number, retryAfterSeconds?: number) =>
    NextResponse.json(data, {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(retryAfterSeconds
          ? { "Retry-After": String(retryAfterSeconds) }
          : {}),
      },
    });
  if (!submissionsEnabled())
    return json({ success: false, error: "SUBMISSIONS_DISABLED" }, 503);
  const origin = request.headers.get("origin");
  if (
    (origin !== null && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return json({ success: false, error: "INVALID_ORIGIN" }, 403);
  try {
    const env = getSubmissionEnv();
    if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES)
      return json({ success: false, error: "TOO_LARGE" }, 413);
    if (
      !/^multipart\/form-data\s*;/i.test(
        request.headers.get("content-type") ?? "",
      )
    )
      return json({ success: false, error: "UNSUPPORTED_MEDIA_TYPE" }, 415);
    const rateKey = submissionRateKey(request, env.CONVEX_SERVER_SECRET);
    const attempt = await checkSubmissionAttempt(rateKey);
    if (!attempt.allowed)
      return json(
        {
          success: false,
          error: "RATE_LIMITED",
          retryAfterSeconds: attempt.retryAfterSeconds,
        },
        429,
        attempt.retryAfterSeconds,
      );
    const bytes = await readSubmissionBody(request);
    let form: FormData;
    try {
      form = await new Request(request.url, {
        method: "POST",
        headers: { "Content-Type": request.headers.get("content-type") ?? "" },
        body: bytes,
      }).formData();
    } catch {
      throw new SubmissionBodyError("INVALID_SUBMISSION", 400);
    }
    submissionTokenSchema.parse(form.get("submissionToken"));
    const fields = JSON.parse(String(form.get("fields")));
    const data =
      kind === "applications"
        ? applicationSchema.parse(fields)
        : leadSchema.parse(fields);
    const file = form.get("resumeFile");
    if (file !== null && !(file instanceof Blob))
      return json({ success: false, error: "INVALID_RESUME" }, 400);
    if (file instanceof Blob) {
      if (kind !== "applications") throw new Error("INVALID_RESUME");
      await validateResume(file);
    }
    const challenge = form.get("turnstileToken");
    if (typeof challenge !== "string" || !challenge || challenge.length > 2048)
      return json({ success: false, error: "CHALLENGE_FAILED" }, 400);
    const verification = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: challenge,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const verified = (await verification.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
    };
    const host = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url)
      .hostname;
    if (
      !verified.success ||
      (!(
        process.env.NODE_ENV !== "production" &&
        env.TURNSTILE_SECRET_KEY === "1x0000000000000000000000000000000AA" &&
        ["localhost", "127.0.0.1"].includes(host)
      ) &&
        (verified.action !== "submission" || verified.hostname !== host))
    )
      return json({ success: false, error: "CHALLENGE_FAILED" }, 400);
    const payload = new FormData();
    payload.set("kind", kind);
    payload.set("submissionToken", String(form.get("submissionToken")));
    payload.set(
      "fields",
      JSON.stringify({
        ...data,
        ...(kind === "applications" && "experience" in data
          ? { experience: data.experience?.toString() ?? "" }
          : {}),
      }),
    );
    if (file instanceof Blob && file.size)
      payload.set(
        "resumeFile",
        file,
        "name" in file ? String(file.name) : "resume.pdf",
      );
    const result = await appendSubmission(payload, rateKey);
    const response = json(
      result.data,
      result.status,
      result.data.retryAfterSeconds,
    );
    if (result.status === 200 && result.data.success) {
      const route = confirmationRoutes[kind];
      response.cookies.set(
        route.cookie,
        createReceipt(kind, env.CONVEX_SERVER_SECRET),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: route.success,
          maxAge: RECEIPT_MAX_AGE,
        },
      );
    }
    return response;
  } catch (error) {
    if (error instanceof SubmissionBodyError)
      return json({ success: false, error: error.code }, error.status);
    if (
      (error instanceof Error &&
        ["ZodError", "SyntaxError"].includes(error.name)) ||
      (error instanceof Error && error.message === "INVALID_RESUME")
    )
      return json({ success: false, error: "INVALID_SUBMISSION" }, 400);
    console.error("Submission service failed", {
      type: error instanceof Error ? error.name : "Unknown",
    });
    return json({ success: false, error: "SUBMISSION_FAILED" }, 503);
  }
}
