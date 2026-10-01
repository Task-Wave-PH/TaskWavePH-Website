import "server-only";
import { createHmac } from "node:crypto";
import { applicationSchema } from "@/features/applications/schema";
import { leadSchema } from "@/features/leads/schema";
import { getSubmissionEnv, submissionsEnabled } from "@/lib/submission-env";
import {
  MAX_REQUEST_BYTES,
  submissionTokenSchema,
  validateResume,
} from "./validation";
import { appendSubmission } from "./convex-adapter";

export async function submitRequest(
  request: Request,
  kind: "applications" | "businessLeads",
) {
  const json = (data: object, status: number) =>
    Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
  if (!submissionsEnabled())
    return json({ success: false, error: "SUBMISSIONS_DISABLED" }, 503);
  try {
    const env = getSubmissionEnv();
    if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES)
      return json({ success: false, error: "TOO_LARGE" }, 413);
    // Bound the stream before multipart parsing, including chunked requests.
    const reader = request.body?.getReader();
    if (!reader)
      return json({ success: false, error: "INVALID_SUBMISSION" }, 400);
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return json({ success: false, error: "TOO_LARGE" }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      body: bytes,
    }).formData();
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
        env.TURNSTILE_SECRET_KEY.startsWith("1x") &&
        ["localhost", "127.0.0.1"].includes(host)
      ) &&
        (verified.action !== "submission" || verified.hostname !== host))
    )
      return json({ success: false, error: "CHALLENGE_FAILED" }, 400);
    // Vercel replaces x-forwarded-for. The global limit remains authoritative on other hosts.
    const address =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const rateKey = createHmac("sha256", env.CONVEX_SERVER_SECRET)
      .update(address)
      .digest("hex");
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
    return json(result.data, result.status);
  } catch (error) {
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
