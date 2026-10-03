import { applicantSearchText } from "../features/applications/search";
import { v, ConvexError } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { applicationData, applicationStatus, resumeFile } from "./validators";
import { applicationSchema } from "../features/applications/schema";
import { sampleResumeBytes } from "../features/applications/sample-resume";
import { syncMetrics } from "./adminMetrics";
const token = (index: number) => `development-seed-v1:${index}`;
function enabled() {
  if (process.env.ALLOW_DEVELOPMENT_SEED !== "true")
    throw new ConvexError("SEED_DISABLED");
}
export const exists = internalQuery({
  args: { index: v.number() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    enabled();
    return !!(await ctx.db
      .query("applications")
      .withIndex("by_submissionToken", (q) =>
        q.eq("submissionToken", token(args.index)),
      )
      .unique());
  },
});
export const insert = internalMutation({
  args: {
    index: v.number(),
    data: applicationData,
    status: applicationStatus,
    resumeFile: v.optional(resumeFile),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    enabled();
    if (
      !Number.isInteger(args.index) ||
      args.index < 0 ||
      args.index >= 50 ||
      args.data.source !== "development-seed-v1"
    )
      throw new ConvexError("INVALID_SEED");
    const old = await ctx.db
      .query("applications")
      .withIndex("by_submissionToken", (q) =>
        q.eq("submissionToken", token(args.index)),
      )
      .unique();
    if (old) {
      if (args.resumeFile) await ctx.storage.delete(args.resumeFile.storageId);
      return false;
    }
    const { website: _website, ...data } = applicationSchema.parse({
      ...args.data,
      experience: args.data.experience?.toString() ?? "",
    });
    void _website;
    const id = await ctx.db.insert("applications", {
      data,
      searchText: applicantSearchText({
        reference: `TW-SEED-${String(args.index + 1).padStart(3, "0")}`,
        data,
      }),
      reference: `TW-SEED-${String(args.index + 1).padStart(3, "0")}`,
      submittedAt: Date.now() - args.index * 86400000,
      consentVersion: "development-sample",
      status: args.status,
      notes: "Synthetic development record. Not a real applicant.",
      submissionToken: token(args.index),
      fingerprint: "development-seed-v1",
      ...(args.resumeFile ? { resumeFile: args.resumeFile } : {}),
    });
    await syncMetrics(ctx, "applications", null, await ctx.db.get(id));
    return true;
  },
});
export const run = internalAction({
  args: {},
  returns: v.object({ created: v.number() }),
  handler: async (ctx) => {
    enabled();
    let created = 0;
    for (let index = 0; index < 50; index++) {
      if (await ctx.runQuery(internal.seed.exists, { index })) continue;
      const { website: _website, ...data } = applicationSchema.parse({
        firstName: "Sample",
        lastName: `Applicant ${index + 1}`,
        email: `seed-${index + 1}@example.invalid`,
        phone: `+6391700000${String(index).padStart(2, "0")}`,
        location: ["Cebu", "Manila", "Davao"][index % 3],
        position: ["Customer Support", "Virtual Assistance", "Web Development"][
          index % 3
        ],
        experience: String(index % 8),
        employmentStatus: index % 2 ? "Employed" : "Seeking work",
        availability: "Within two weeks",
        message: "Development sample only.",
        privacyConsent: true,
        source: "development-seed-v1",
        campaign: "development-seed-v1",
      });
      void _website;
      let file;
      if (index < 5) {
        const bytes = sampleResumeBytes();
        const storageId = await ctx.storage.store(
          new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" }),
        );
        file = {
          storageId,
          name: "sample-cv.pdf",
          size: bytes.length,
          contentType: "application/pdf" as const,
        };
      }
      try {
        if (
          await ctx.runMutation(internal.seed.insert, {
            index,
            data,
            status: (["New", "Reviewed", "Shortlisted", "Closed"] as const)[
              index % 4
            ],
            ...(file ? { resumeFile: file } : {}),
          })
        )
          created++;
      } catch (error) {
        if (file) await ctx.storage.delete(file.storageId);
        throw error;
      }
    }
    return { created };
  },
});
export const cleanup = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    enabled();
    let removed = 0;
    for (let index = 0; index < 50; index++) {
      const row = await ctx.db
        .query("applications")
        .withIndex("by_submissionToken", (q) =>
          q.eq("submissionToken", token(index)),
        )
        .unique();
      if (!row || row.data.source !== "development-seed-v1") continue;
      if (row.resumeFile) await ctx.storage.delete(row.resumeFile.storageId);
      await syncMetrics(ctx, "applications", row, null);
      await ctx.db.delete(row._id);
      removed++;
    }
    return removed;
  },
});
