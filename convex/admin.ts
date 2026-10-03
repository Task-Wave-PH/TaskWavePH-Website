import { applicantSearchText } from "../features/applications/search";
import { followUpDateSchema } from "../features/leads/follow-up";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireOwner } from "./adminAccess";
import { applicationFilters, filteredApplications } from "./applicationFilters";
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
import { syncMetrics } from "./adminMetrics";
const applicationDoc = v.object({
  _id: v.id("applications"),
  _creationTime: v.number(),
  data: applicationData,
  ...baseFields,
  status: applicationStatus,
  resumeFile: v.optional(resumeFile),
  searchText: v.optional(v.string()),
});
const leadDoc = v.object({
  _id: v.id("businessLeads"),
  _creationTime: v.number(),
  data: leadData,
  priority: v.optional(v.boolean()),
  nextFollowUp: v.optional(v.string()),
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
  priority: v.optional(v.boolean()),
  source: v.optional(v.string()),
  campaign: v.optional(v.string()),
  jobTitle: v.optional(v.string()),
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
    priorityOnly: v.optional(v.boolean()),
    filters: v.optional(applicationFilters),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(summary),
  handler: async (ctx, args) => {
    if (args.paginationOpts.numItems > 50 || args.paginationOpts.numItems < 1)
      throw new ConvexError("INVALID_PAGE_SIZE");
    if (args.kind === "applications") {
      const status = args.status ? applicationStatus : null;
      const allowed = ["New", "Reviewed", "Shortlisted", "Closed"];
      if (status && !allowed.includes(args.status!))
        throw new ConvexError("INVALID_STATUS");
      const result = await filteredApplications(
        ctx,
        args.status as
          "New" | "Reviewed" | "Shortlisted" | "Closed" | undefined,
        args.filters,
        args.paginationOpts,
      );
      return {
        ...result,
        page: result.page.map((row) => ({
          id: row._id,
          reference: row.reference,
          name: `${row.data.firstName} ${row.data.lastName}`,
          email: row.data.email,
          status: row.status,
          submittedAt: row.submittedAt,
          source: row.data.source,
          campaign: row.data.campaign,
          jobTitle: row.data.position,
        })),
      };
    }
    if (args.status && !["New", "Contacted", "Closed"].includes(args.status))
      throw new ConvexError("INVALID_STATUS");
    const query = args.priorityOnly
      ? args.status
        ? ctx.db
            .query("businessLeads")
            .withIndex("by_priority_status", (q) =>
              q
                .eq("priority", true)
                .eq("status", args.status as "New" | "Contacted" | "Closed"),
            )
        : ctx.db
            .query("businessLeads")
            .withIndex("by_priority", (q) => q.eq("priority", true))
      : args.status
        ? ctx.db
            .query("businessLeads")
            .withIndex("by_status", (q) =>
              q.eq("status", args.status as "New" | "Contacted" | "Closed"),
            )
        : ctx.db.query("businessLeads");
    const result = await query.order("desc").paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((row) => ({
        id: row._id,
        reference: row.reference,
        name: row.data.company,
        priority: row.priority ?? false,
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
    nextFollowUp: v.optional(v.union(v.string(), v.null())),
    expected: v.optional(
      v.object({
        status: v.string(),
        notes: v.string(),
        nextFollowUp: v.optional(v.union(v.string(), v.null())),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (
      typeof args.nextFollowUp === "string" &&
      !followUpDateSchema.safeParse(args.nextFollowUp).success
    )
      throw new ConvexError("INVALID_FOLLOW_UP");
    if (args.kind === "applications" && args.nextFollowUp !== undefined)
      throw new ConvexError("INVALID_FOLLOW_UP");
    if (args.nextFollowUp !== undefined && !args.expected)
      throw new ConvexError("EDIT_CONFLICT");
    if (args.notes.length > 2000) throw new ConvexError("NOTES_TOO_LONG");
    const id = ctx.db.normalizeId(args.kind, args.id);
    if (!id) throw new ConvexError("NOT_FOUND");
    const record = await ctx.db.get(id);
    if (!record) throw new ConvexError("NOT_FOUND");
    if (
      args.expected &&
      (record.status !== args.expected.status ||
        record.notes !== args.expected.notes ||
        (args.kind === "businessLeads" &&
          args.nextFollowUp !== undefined &&
          ("nextFollowUp" in record ? (record.nextFollowUp ?? null) : null) !==
            (args.expected.nextFollowUp ?? null)))
    )
      throw new ConvexError("EDIT_CONFLICT");
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
        ...(args.nextFollowUp !== undefined
          ? { nextFollowUp: args.nextFollowUp ?? undefined }
          : {}),
      });
    }
    await syncMetrics(ctx, args.kind, record, await ctx.db.get(id));
    for (const action of [
      ...(record.status !== args.status ? ["status_changed"] : []),
      ...(record.notes !== args.notes.trim() ? ["notes_updated"] : []),
      ...(args.nextFollowUp !== undefined &&
      ("nextFollowUp" in record ? (record.nextFollowUp ?? null) : null) !==
        args.nextFollowUp
        ? ["follow_up_changed"]
        : []),
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
    await syncMetrics(ctx, kind, record, null);
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

export const setPriority = adminMutation({
  args: { id: v.id("businessLeads"), priority: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { id, priority }) => {
    const lead = await ctx.db.get(id);
    if (!lead) throw new ConvexError("NOT_FOUND");
    if ((lead.priority ?? false) === priority) return null;
    await ctx.db.patch(id, { priority });
    await syncMetrics(ctx, "businessLeads", lead, await ctx.db.get(id));
    await ctx.db.insert("adminActivity", {
      actor: ctx.actor,
      record: id,
      action: priority ? "lead_prioritized" : "lead_unmarked",
      timestamp: Date.now(),
    });
    return null;
  },
});

// Owner-only metadata; never join applicant profiles or internal notes.
export const activity = adminQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    v.object({
      id: v.id("adminActivity"),
      actor: v.string(),
      actorLabel: v.string(),
      record: v.string(),
      action: v.string(),
      timestamp: v.number(),
    }),
  ),
  handler: async (ctx, { paginationOpts }) => {
    await requireOwner(ctx);
    if (
      !Number.isInteger(paginationOpts.numItems) ||
      paginationOpts.numItems < 1 ||
      paginationOpts.numItems > 50
    )
      throw new ConvexError("INVALID_PAGE_SIZE");
    const page = await ctx.db
      .query("adminActivity")
      .withIndex("by_timestamp")
      .order("desc")
      .paginate(paginationOpts);
    const actors = new Map<string, string>();
    for (const actor of new Set(page.page.map((row) => row.actor))) {
      const staff = await ctx.db
        .query("adminUsers")
        .withIndex("by_subject", (q) => q.eq("subject", actor))
        .unique();
      actors.set(actor, staff?.name || staff?.email || actor);
    }
    return {
      ...page,
      page: page.page.map((row) => ({
        id: row._id,
        actor: row.actor,
        actorLabel: actors.get(row.actor)!,
        record: row.record,
        action: row.action,
        timestamp: row.timestamp,
      })),
    };
  },
});
export const attributionOptions = adminQuery({
  args: {},
  returns: v.object({
    sources: v.array(v.string()),
    campaigns: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const sources: string[] = [],
      campaigns: string[] = [];
    // Jump between distinct indexed codes, rather than scanning every application.
    for (let i = 0, previous = ""; i < 50; i++) {
      const row = await ctx.db
        .query("applications")
        .withIndex("by_source_submittedAt", (q) =>
          q.gt("data.source", previous),
        )
        .first();
      if (!row) break;
      previous = row.data.source;
      sources.push(previous);
    }
    for (let i = 0, previous = ""; i < 50; i++) {
      const row = await ctx.db
        .query("applications")
        .withIndex("by_campaign_submittedAt", (q) =>
          q.gt("data.campaign", previous),
        )
        .first();
      if (!row) break;
      previous = row.data.campaign;
      campaigns.push(previous);
    }
    return { sources, campaigns };
  },
});
// Trusted, bounded and repeatable migration for historical applications.
export const backfillSearch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db
      .query("applications")
      .paginate({ cursor, numItems: 100 });
    for (const row of page.page) {
      const searchText = applicantSearchText(row);
      if (row.searchText !== searchText)
        await ctx.db.patch(row._id, { searchText });
    }
    if (!page.isDone)
      await ctx.scheduler.runAfter(0, internal.admin.backfillSearch, {
        cursor: page.continueCursor,
      });
    return null;
  },
});
