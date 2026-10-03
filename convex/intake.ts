import { applicantSearchText } from "../features/applications/search";
import { ConvexError, v } from "convex/values";
import { RateLimiter, HOUR, MINUTE } from "@convex-dev/rate-limiter";
import { internalMutation, internalQuery } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { applicationSchema } from "../features/applications/schema";
import { leadSchema } from "../features/leads/schema";
import { CONSENT_VERSION } from "../features/submissions/validation";
import {
  applicationData,
  leadData,
  kindValidator,
  resumeFile,
} from "./validators";
import { syncMetrics } from "./adminMetrics";
const limiter = new RateLimiter(components.rateLimiter, {
  attempts: { kind: "fixed window", rate: 20, period: 10 * MINUTE },
  globalAttempts: { kind: "fixed window", rate: 120, period: MINUTE },
  intake: { kind: "fixed window", rate: 5, period: HOUR },
  global: { kind: "fixed window", rate: 30, period: MINUTE },
});
export const attempt = internalMutation({
  args: { rateKey: v.string() },
  returns: v.object({ allowed: v.boolean(), retryAfterSeconds: v.number() }),
  handler: async (ctx, { rateKey }) => {
    if (!/^[a-f0-9]{64}$/.test(rateKey)) throw new Error("Invalid rate key");
    const local = await limiter.limit(ctx, "attempts", { key: rateKey });
    const global = await limiter.limit(ctx, "globalAttempts");
    // Returning denial commits successful limiter updates; throwing rolls them back.
    return {
      allowed: local.ok && global.ok,
      retryAfterSeconds:
        local.ok && global.ok
          ? 0
          : Math.max(
              1,
              Math.ceil(
                Math.max(
                  local.ok ? 0 : (local.retryAfter ?? 0),
                  global.ok ? 0 : (global.retryAfter ?? 0),
                ) / 1000,
              ),
            ),
    };
  },
});
export const reserve = internalMutation({
  args: {
    kind: kindValidator,
    token: v.string(),
    fingerprint: v.string(),
    rateKey: v.string(),
  },
  returns: v.object({
    state: v.union(
      v.literal("reserved"),
      v.literal("complete"),
      v.literal("busy"),
    ),
    reference: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const token = `${args.kind}:${args.token}`;
    const existing = await ctx.db
      .query(args.kind)
      .withIndex("by_submissionToken", (q) => q.eq("submissionToken", token))
      .unique();
    if (existing) {
      if (existing.fingerprint !== args.fingerprint)
        throw new ConvexError("TOKEN_CONFLICT");
      return { state: "complete" as const, reference: existing.reference };
    }
    const pending = await ctx.db
      .query("pendingUploads")
      .withIndex("by_submissionToken", (q) => q.eq("submissionToken", token))
      .unique();
    if (pending) return { state: "busy" as const };
    const local = await limiter.limit(ctx, "intake", { key: args.rateKey });
    const global = await limiter.limit(ctx, "global");
    if (!local.ok || !global.ok)
      throw new ConvexError({
        code: "RATE_LIMITED",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil(
            Math.max(
              local.ok ? 0 : (local.retryAfter ?? 0),
              global.ok ? 0 : (global.retryAfter ?? 0),
            ) / 1000,
          ),
        ),
      });
    await ctx.db.insert("pendingUploads", {
      submissionToken: token,
      fingerprint: args.fingerprint,
      expiresAt: Date.now() + HOUR,
    });
    return { state: "reserved" as const };
  },
});
export const attach = internalMutation({
  args: { token: v.string(), storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("pendingUploads")
      .withIndex("by_submissionToken", (q) =>
        q.eq("submissionToken", args.token),
      )
      .unique();
    if (!pending) throw new Error("Missing reservation");
    await ctx.db.patch(pending._id, { storageId: args.storageId });
    return null;
  },
});
export const release = internalMutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const pending = await ctx.db
      .query("pendingUploads")
      .withIndex("by_submissionToken", (q) => q.eq("submissionToken", token))
      .unique();
    if (pending) {
      if (pending.storageId) await ctx.storage.delete(pending.storageId);
      await ctx.db.delete(pending._id);
    }
    return null;
  },
});
export const save = internalMutation({
  args: {
    token: v.string(),
    fingerprint: v.string(),
    data: v.union(applicationData, leadData),
    kind: kindValidator,
    resumeFile: v.optional(resumeFile),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("pendingUploads")
      .withIndex("by_submissionToken", (q) =>
        q.eq("submissionToken", args.token),
      )
      .unique();
    if (
      !pending ||
      pending.fingerprint !== args.fingerprint ||
      pending.expiresAt <= Date.now()
    )
      throw new Error("Invalid reservation");
    const submittedAt = Date.now();
    const reference = `TW-${args.kind === "applications" ? "A" : "B"}-${submittedAt}-${pending._id}`;
    const common = {
      reference,
      submittedAt,
      submissionToken: args.token,
      fingerprint: args.fingerprint,
      consentVersion: CONSENT_VERSION,
      notes: "",
      status: "New" as const,
    };
    if (args.kind === "applications" && "firstName" in args.data) {
      const data = applicationSchema.parse({
        ...args.data,
        experience: args.data.experience?.toString() ?? "",
      });
      const { website: _honeypot, ...normalized } = data;
      void _honeypot;
      if (args.resumeFile && pending.storageId !== args.resumeFile.storageId)
        throw new Error("Invalid attachment");
      let jobTitle: string | undefined;
      if (normalized.jobId) {
        const jobId = ctx.db.normalizeId("jobs", normalized.jobId);
        const job = jobId ? await ctx.db.get(jobId) : null;
        if (job?.status !== "Published")
          throw new ConvexError("JOB_UNAVAILABLE");
        jobTitle = job.title;
        normalized.position = job.title;
      }
      const id = await ctx.db.insert("applications", {
        ...common,
        searchText: applicantSearchText({ reference, data: normalized }),
        data: { ...normalized, ...(jobTitle ? { jobTitle } : {}) },
        ...(args.resumeFile ? { resumeFile: args.resumeFile } : {}),
      });
      await syncMetrics(ctx, "applications", null, await ctx.db.get(id));
    } else if (args.kind === "businessLeads" && "company" in args.data) {
      const { website: _honeypot, ...data } = leadSchema.parse(args.data);
      void _honeypot;
      const id = await ctx.db.insert("businessLeads", { ...common, data });
      await syncMetrics(ctx, "businessLeads", null, await ctx.db.get(id));
    } else throw new Error("Invalid record");
    await ctx.db.delete(pending._id);
    return reference;
  },
});
export const cleanup = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("pendingUploads")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", Date.now()))
      .take(100);
    for (const row of expired) {
      if (row.storageId) await ctx.storage.delete(row.storageId);
      await ctx.db.delete(row._id);
    }
    if (expired.length === 100)
      await ctx.scheduler.runAfter(0, internal.intake.cleanup, {});
    return null;
  },
});
// Also removes files left behind if an action stopped between storage.store and attach.
export const cleanupOrphans = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.system
      .query("_storage")
      .paginate({ numItems: 100, cursor });
    for (const file of page.page) {
      if (file._creationTime > Date.now() - HOUR) continue;
      const application = await ctx.db
        .query("applications")
        .withIndex("by_resumeStorage", (q) =>
          q.eq("resumeFile.storageId", file._id),
        )
        .first();
      const pending = await ctx.db
        .query("pendingUploads")
        .withIndex("by_storageId", (q) => q.eq("storageId", file._id))
        .first();
      if (!application && !pending) await ctx.storage.delete(file._id);
    }
    if (!page.isDone)
      await ctx.scheduler.runAfter(0, internal.intake.cleanupOrphans, {
        cursor: page.continueCursor,
      });
    return null;
  },
});
export const reservation = internalQuery({
  args: { token: v.string() },
  returns: v.union(v.null(), v.id("_storage")),
  handler: async (ctx, { token }) => {
    const pending = await ctx.db
      .query("pendingUploads")
      .withIndex("by_submissionToken", (q) => q.eq("submissionToken", token))
      .unique();
    return pending?.storageId ?? null;
  },
});
