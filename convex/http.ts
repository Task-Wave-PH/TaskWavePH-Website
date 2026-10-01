import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

import { applicationSchema } from "../features/applications/schema";
import { leadSchema } from "../features/leads/schema";
import {
  submissionTokenSchema,
  validateResume,
  MAX_REQUEST_BYTES,
} from "../features/submissions/validation";
const http = httpRouter();
const json = (data: object, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
http.route({
  path: "/submit",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CONVEX_SERVER_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
      return json({ error: "UNAUTHORIZED" }, 401);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_REQUEST_BYTES)
      return json({ error: "TOO_LARGE" }, 413);
    const body = await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      body: bytes,
    }).formData();
    let token: string | undefined;
    let storageId: import("./_generated/dataModel").Id<"_storage"> | undefined;
    let reference: string | undefined;
    try {
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
      if (error instanceof ConvexError && error.data === "RATE_LIMITED")
        return json({ error: "RATE_LIMITED" }, 429);
      if (error instanceof ConvexError && error.data === "TOKEN_CONFLICT")
        return json({ error: "TOKEN_CONFLICT" }, 409);
      if (
        error instanceof Error &&
        (error.name === "ZodError" || error.message === "INVALID_RESUME")
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
    try {
      const id = new URL(request.url).searchParams.get("id") ?? "";
      const file = await ctx.runQuery(internal.downloads.find, { id });
      if (!file) return new Response("Not found", { status: 404 });
      const blob = await ctx.storage.get(file.storageId);
      if (!blob) return new Response("Not found", { status: 404 });
      await ctx.runMutation(internal.downloads.audit, { id });
      return new Response(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="resume.pdf"',
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "X-Robots-Tag": "noindex",
        },
      });
    } catch {
      return new Response("Access denied", { status: 403 });
    }
  }),
});
export default http;
