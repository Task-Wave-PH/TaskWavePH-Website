import { ConvexError, v } from "convex/values";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { adminQuery, adminMutation } from "./adminAccess";
import {
  applicationData,
  leadData,
  applicationStatus,
  leadStatus,
  resumeFile,
  baseFields,
  kindValidator,
} from "./validators";
const applicationDoc = v.object({
  _id: v.id("applications"),
  _creationTime: v.number(),
  data: applicationData,
  ...baseFields,
  status: applicationStatus,
  resumeFile: v.optional(resumeFile),
});
const leadDoc = v.object({
  _id: v.id("businessLeads"),
  _creationTime: v.number(),
  data: leadData,
  ...baseFields,
  status: leadStatus,
});
const summary = v.object({
  id: v.union(v.id("applications"), v.id("businessLeads")),
  reference: v.string(),
  name: v.string(),
  email: v.string(),
  status: v.string(),
  submittedAt: v.number(),
});
export const access = adminQuery({
  args: {},
  returns: v.boolean(),
  handler: async () => true,
});
export const list = adminQuery({
  args: {
    kind: kindValidator,
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(summary),
  handler: async (ctx, args) => {
    if (args.paginationOpts.numItems > 50)
      throw new ConvexError("INVALID_PAGE_SIZE");
    if (args.kind === "applications") {
      const status = args.status ? applicationStatus : null;
      const allowed = ["New", "Reviewed", "Shortlisted", "Closed"];
      if (status && !allowed.includes(args.status!))
        throw new ConvexError("INVALID_STATUS");
      const result = args.status
        ? await ctx.db
            .query("applications")
            .withIndex("by_status", (q) =>
              q.eq(
                "status",
                args.status as "New" | "Reviewed" | "Shortlisted" | "Closed",
              ),
            )
            .order("desc")
            .paginate(args.paginationOpts)
        : await ctx.db
            .query("applications")
            .order("desc")
            .paginate(args.paginationOpts);
      return {
        ...result,
        page: result.page.map((row) => ({
          id: row._id,
          reference: row.reference,
          name: `${row.data.firstName} ${row.data.lastName}`,
          email: row.data.email,
          status: row.status,
          submittedAt: row.submittedAt,
        })),
      };
    }
    if (args.status && !["New", "Contacted", "Closed"].includes(args.status))
      throw new ConvexError("INVALID_STATUS");
    const result = args.status
      ? await ctx.db
          .query("businessLeads")
          .withIndex("by_status", (q) =>
            q.eq("status", args.status as "New" | "Contacted" | "Closed"),
          )
          .order("desc")
          .paginate(args.paginationOpts)
      : await ctx.db
          .query("businessLeads")
          .order("desc")
          .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((row) => ({
        id: row._id,
        reference: row.reference,
        name: row.data.company,
        email: row.data.email,
        status: row.status,
        submittedAt: row.submittedAt,
      })),
    };
  },
});
export const detail = adminQuery({
  args: { kind: kindValidator, id: v.string() },
  returns: v.union(applicationDoc, leadDoc, v.null()),
  handler: async (ctx, { kind, id }) => {
    const normalized = ctx.db.normalizeId(kind, id);
    if (!normalized) return null;
    return await ctx.db.get(normalized);
  },
});
export const update = adminMutation({
  args: {
    kind: kindValidator,
    id: v.string(),
    status: v.string(),
    notes: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.notes.length > 2000) throw new ConvexError("NOTES_TOO_LONG");
    const id = ctx.db.normalizeId(args.kind, args.id);
    if (!id) throw new ConvexError("NOT_FOUND");
    const record = await ctx.db.get(id);
    if (!record) throw new ConvexError("NOT_FOUND");
    if (args.kind === "applications") {
      const valid = ["New", "Reviewed", "Shortlisted", "Closed"] as const;
      const status = valid.find((value) => value === args.status);
      if (!status) throw new ConvexError("INVALID_STATUS");
      await ctx.db.patch(ctx.db.normalizeId("applications", args.id)!, {
        status,
        notes: args.notes.trim(),
      });
    } else {
      const valid = ["New", "Contacted", "Closed"] as const;
      const status = valid.find((value) => value === args.status);
      if (!status) throw new ConvexError("INVALID_STATUS");
      await ctx.db.patch(ctx.db.normalizeId("businessLeads", args.id)!, {
        status,
        notes: args.notes.trim(),
      });
    }
    for (const action of [
      ...(record.status !== args.status ? ["status_changed"] : []),
      ...(record.notes !== args.notes.trim() ? ["notes_updated"] : []),
    ])
      await ctx.db.insert("adminActivity", {
        actor: ctx.actor,
        record: args.id,
        action,
        timestamp: Date.now(),
      });
    return null;
  },
});
export const remove = adminMutation({
  args: { kind: kindValidator, id: v.string() },
  returns: v.null(),
  handler: async (ctx, { kind, id }) => {
    const normalized = ctx.db.normalizeId(kind, id);
    if (!normalized) throw new ConvexError("NOT_FOUND");
    const record = await ctx.db.get(normalized);
    if (!record) throw new ConvexError("NOT_FOUND");
    if ("resumeFile" in record && record.resumeFile)
      await ctx.storage.delete(record.resumeFile.storageId);
    await ctx.db.delete(normalized);
    await ctx.db.insert("adminActivity", {
      actor: ctx.actor,
      record: id,
      action: "deleted",
      timestamp: Date.now(),
    });
    return null;
  },
});
