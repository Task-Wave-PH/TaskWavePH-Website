import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

import { applicationSchema } from "../features/applications/schema";
import { leadSchema } from "../features/leads/schema";
import {
  submissionTokenSchema,
  validateResume,
} from "../features/submissions/validation";
import {
  readSubmissionBody,
  SubmissionBodyError,
} from "../features/submissions/request-body";
const http = httpRouter();
const json = (data: object, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
http.route({
  path: "/submission-attempt",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CONVEX_SERVER_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
      return json({ error: "UNAUTHORIZED" }, 401);
    const rateKey = request.headers.get("x-rate-key");
    if (!rateKey || !/^[a-f0-9]{64}$/.test(rateKey))
      return json({ error: "INVALID_SUBMISSION" }, 400);
    const result = await ctx.runMutation(internal.intake.attempt, { rateKey });
    return result.allowed
      ? json(result)
      : Response.json(
          {
            error: "RATE_LIMITED",
            retryAfterSeconds: result.retryAfterSeconds,
          },
          {
            status: 429,
            headers: {
              "Cache-Control": "no-store",
              "Retry-After": String(result.retryAfterSeconds),
            },
          },
        );
  }),
});
http.route({
  path: "/submit",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CONVEX_SERVER_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
      return json({ error: "UNAUTHORIZED" }, 401);
    let token: string | undefined;
    let storageId: import("./_generated/dataModel").Id<"_storage"> | undefined;
    let reference: string | undefined;
    try {
      const contentType = request.headers.get("content-type") ?? "";
      if (!/^multipart\/form-data\s*;/i.test(contentType))
        return json({ error: "INVALID_SUBMISSION" }, 400);
      const bytes = await readSubmissionBody(request);
      let body: FormData;
      try {
        body = await new Request(request.url, {
          method: "POST",
          headers: { "Content-Type": contentType },
          body: bytes,
        }).formData();
      } catch {
        throw new SubmissionBodyError("INVALID_SUBMISSION", 400);
      }
      const kind = body.get("kind");
      if (kind !== "applications" && kind !== "businessLeads")
        return json({ error: "INVALID_SUBMISSION" }, 400);
      const submissionToken = submissionTokenSchema.parse(
        body.get("submissionToken"),
      );
      const fields = JSON.parse(String(body.get("fields")));
      const parsed =
        kind === "applications"
          ? applicationSchema.parse(fields)
          : leadSchema.parse(fields);
      const { website: _honeypot, ...data } = parsed;
      void _honeypot;
      const file = body.get("resumeFile");
      if (file !== null && !(file instanceof Blob))
        return json({ error: "INVALID_RESUME" }, 400);
      if (file instanceof Blob) {
        if (kind !== "applications")
          return json({ error: "INVALID_RESUME" }, 400);
        await validateResume(file);
      }
      const hashInput = new Uint8Array(
        new TextEncoder().encode(JSON.stringify({ kind, data })),
      );
      const fileBytes =
        file instanceof Blob
          ? new Uint8Array(await file.arrayBuffer())
          : new Uint8Array();
      const merged = new Uint8Array(hashInput.length + fileBytes.length);
      merged.set(hashInput);
      merged.set(fileBytes, hashInput.length);
      const digest = await crypto.subtle.digest("SHA-256", merged);
      const fingerprint = Array.from(new Uint8Array(digest), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      const rateKey = request.headers.get("x-rate-key");
      if (!rateKey || !/^[a-f0-9]{64}$/.test(rateKey))
        return json({ error: "INVALID_SUBMISSION" }, 400);
      const reservation = await ctx.runMutation(internal.intake.reserve, {
        kind,
        token: submissionToken,
        fingerprint,
        rateKey,
      });
      if (reservation.state === "complete")
        return json({ success: true, reference: reservation.reference });
      if (reservation.state === "busy")
        return json({ error: "SUBMISSION_IN_PROGRESS" }, 409);
      token = `${kind}:${submissionToken}`;
      let resumeFile;
      if (file instanceof Blob) {
        storageId = await ctx.storage.store(file);
        await ctx.runMutation(internal.intake.attach, { token, storageId });
        resumeFile = {
          storageId,
          name: "name" in file ? String(file.name).slice(0, 200) : "resume.pdf",
          size: file.size,
          contentType: "application/pdf" as const,
        };
      }
      reference = await ctx.runMutation(internal.intake.save, {
        token,
        fingerprint,
        kind,
        data,
        ...(resumeFile ? { resumeFile } : {}),
      });
      return json({ success: true, reference });
    } catch (error) {
      if (token && !reference) {
        await ctx
          .runMutation(internal.intake.release, { token })
          .catch(() => {});
      }
      if (error instanceof SubmissionBodyError)
        return json({ error: error.code }, error.status);
      if (error instanceof ConvexError && error.data === "JOB_UNAVAILABLE")
        return json({ error: "JOB_UNAVAILABLE" }, 409);
      if (
        error instanceof ConvexError &&
        typeof error.data === "object" &&
        error.data !== null &&
        "code" in error.data &&
        error.data.code === "RATE_LIMITED" &&
        "retryAfterSeconds" in error.data
      ) {
        const seconds = Math.min(
          3600,
          Math.max(1, Number(error.data.retryAfterSeconds) || 60),
        );
        return Response.json(
          { error: "RATE_LIMITED", retryAfterSeconds: seconds },
          {
            status: 429,
            headers: {
              "Cache-Control": "no-store",
              "Retry-After": String(seconds),
            },
          },
        );
      }
      if (error instanceof ConvexError && error.data === "TOKEN_CONFLICT")
        return json({ error: "TOKEN_CONFLICT" }, 409);
      if (
        error instanceof Error &&
        (["ZodError", "SyntaxError"].includes(error.name) ||
          error.message === "INVALID_RESUME")
      )
        return json({ error: "INVALID_SUBMISSION" }, 400);
      console.error("Intake failed", {
        type: error instanceof Error ? error.name : "Unknown",
      });
      return json({ error: "SUBMISSION_FAILED" }, 503);
    }
  }),
});
http.route({
  path: "/resume",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const headers = {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    };
    try {
      const params = new URL(request.url).searchParams;
      const id = params.get("id") ?? "";
      const mode = params.get("mode") ?? "download";
      if (!["view", "download"].includes(mode))
        return new Response("Invalid mode", { status: 400, headers });
      const file = await ctx.runQuery(internal.downloads.find, { id });
      if (!file) return new Response("Not found", { status: 404, headers });
      const blob = await ctx.storage.get(file.storageId);
      if (!blob) return new Response("Not found", { status: 404, headers });
      await ctx.runMutation(internal.downloads.audit, {
        id,
        mode: mode as "view" | "download",
      });
      return new Response(blob, {
        headers: {
          ...headers,
          "Content-Type": "application/pdf",
          "Content-Disposition": `${mode === "view" ? "inline" : "attachment"}; filename="resume.pdf"`,
        },
      });
    } catch {
      return new Response("Access denied", { status: 403, headers });
    }
  }),
});
export default http;
