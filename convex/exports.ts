import { v } from "convex/values";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { adminQuery, adminMutation } from "./adminAccess";
import { applicationData, applicationStatus } from "./validators";
import { ConvexError } from "convex/values";
import { limitAdminOperation } from "./adminRateLimits";
export const begin = adminMutation({
  args: {},
  returns: v.object({ allowed: v.boolean(), retryAfterSeconds: v.number() }),
  handler: async (ctx) => limitAdminOperation(ctx, ctx.actor, "export"),
});
const rowValidator = v.object({
  _id: v.id("applications"),
  reference: v.string(),
  submittedAt: v.number(),
  consentVersion: v.string(),
  status: applicationStatus,
  notes: v.string(),
  data: applicationData,
  resumeFile: v.optional(v.object({ name: v.string(), size: v.number() })),
});
export const page = adminQuery({
  args: {
    status: v.optional(applicationStatus),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(rowValidator),
  handler: async (ctx, args) => {
    if (args.paginationOpts.numItems > 100)
      throw new ConvexError("INVALID_PAGE_SIZE");
    const query = args.status
      ? ctx.db
          .query("applications")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
      : ctx.db.query("applications");
    const result = await query.order("desc").paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((row) => ({
        _id: row._id,
        reference: row.reference,
        submittedAt: row.submittedAt,
        consentVersion: row.consentVersion,
        status: row.status,
        notes: row.notes,
        data: row.data,
        ...(row.resumeFile
          ? {
              resumeFile: {
                name: row.resumeFile.name,
                size: row.resumeFile.size,
              },
            }
          : {}),
      })),
    };
  },
});
export const audit = adminMutation({
  args: {
    format: v.union(v.literal("csv"), v.literal("xlsx")),
    count: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.count) || args.count < 0 || args.count > 5000)
      throw new ConvexError("INVALID_COUNT");
    await ctx.db.insert("adminActivity", {
      actor: ctx.actor,
      record: "applications",
      action: `export_${args.format}_${args.count}`,
      timestamp: Date.now(),
    });
    return null;
  },
});
