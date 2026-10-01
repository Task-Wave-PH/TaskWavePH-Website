import { ConvexError, v } from "convex/values";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { query } from "./_generated/server";
import { adminQuery, adminMutation } from "./adminAccess";
import { jobFields, jobInput, jobStatus, jobView } from "./jobValidators";
import {
  jobSchema,
  serviceAreas,
  workArrangements,
} from "../features/jobs/schema";
import type { Doc } from "./_generated/dataModel";
import { syncMetrics } from "./adminMetrics";
const project = (row: Doc<"jobs">) => ({
  _id: row._id,
  title: row.title,
  serviceArea: row.serviceArea,
  location: row.location,
  arrangement: row.arrangement,
  employmentType: row.employmentType,
  description: row.description,
  responsibilities: row.responsibilities,
  requirements: row.requirements,
  salary: row.salary,
  status: row.status,
  updatedAt: row.updatedAt,
  ...(row.publishedAt ? { publishedAt: row.publishedAt } : {}),
});
export const published = query({
  args: {
    serviceArea: v.optional(jobFields.serviceArea),
    arrangement: v.optional(jobFields.arrangement),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(jobView),
  handler: async (ctx, args) => {
    if (
      args.paginationOpts.numItems < 1 ||
      args.paginationOpts.numItems > 100 ||
      (args.serviceArea && !serviceAreas.some((s) => s === args.serviceArea)) ||
      (args.arrangement &&
        !workArrangements.some((s) => s === args.arrangement))
    )
      throw new ConvexError("INVALID_FILTER");
    const rows =
      args.serviceArea && args.arrangement
        ? ctx.db
            .query("jobs")
            .withIndex("by_status_service_arrangement_published", (q) =>
              q
                .eq("status", "Published")
                .eq("serviceArea", args.serviceArea!)
                .eq("arrangement", args.arrangement!),
            )
        : args.serviceArea
          ? ctx.db
              .query("jobs")
              .withIndex("by_status_service_published", (q) =>
                q
                  .eq("status", "Published")
                  .eq("serviceArea", args.serviceArea!),
              )
          : args.arrangement
            ? ctx.db
                .query("jobs")
                .withIndex("by_status_arrangement_published", (q) =>
                  q
                    .eq("status", "Published")
                    .eq("arrangement", args.arrangement!),
                )
            : ctx.db
                .query("jobs")
                .withIndex("by_status_published", (q) =>
                  q.eq("status", "Published"),
                );
    const result = await rows.order("desc").paginate(args.paginationOpts);
    return { ...result, page: result.page.map(project) };
  },
});
export const detail = query({
  args: { id: v.string() },
  returns: v.union(jobView, v.null()),
  handler: async (ctx, { id }) => {
    const normalized = ctx.db.normalizeId("jobs", id);
    if (!normalized) return null;
    const job = await ctx.db.get(normalized);
    return job?.status === "Published" ? project(job) : null;
  },
});
export const staffList = adminQuery({
  args: {
    status: v.optional(jobStatus),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(jobView),
  handler: async (ctx, args) => {
    if (args.paginationOpts.numItems > 50 || args.paginationOpts.numItems < 1)
      throw new ConvexError("INVALID_PAGE_SIZE");
    const rows = args.status
      ? ctx.db
          .query("jobs")
          .withIndex("by_status_published", (q) => q.eq("status", args.status!))
      : ctx.db.query("jobs");
    const result = await rows.order("desc").paginate(args.paginationOpts);
    return { ...result, page: result.page.map(project) };
  },
});
export const staffDetail = adminQuery({
  args: { id: v.string() },
  returns: v.union(jobView, v.null()),
  handler: async (ctx, { id }) => {
    const normalized = ctx.db.normalizeId("jobs", id);
    if (!normalized) return null;
    const row = await ctx.db.get(normalized);
    return row ? project(row) : null;
  },
});
export const save = adminMutation({
  args: { id: v.optional(v.id("jobs")), data: jobInput },
  returns: v.id("jobs"),
  handler: async (ctx, { id, data }) => {
    const parsed = jobSchema.safeParse(data);
    if (!parsed.success) throw new ConvexError("INVALID_JOB");
    const old = id ? await ctx.db.get(id) : null;
    if (id && !old) throw new ConvexError("NOT_FOUND");
    const timestamp = Date.now();
    if (id) await ctx.db.patch(id, { ...parsed.data, updatedAt: timestamp });
    else
      id = await ctx.db.insert("jobs", {
        ...parsed.data,
        status: "Draft",
        updatedAt: timestamp,
      });
    await syncMetrics(ctx, "jobs", old, await ctx.db.get(id));
    await ctx.db.insert("adminActivity", {
      actor: ctx.actor,
      record: id,
      action: "job_save",
      timestamp,
    });
    return id;
  },
});
export const setStatus = adminMutation({
  args: { id: v.id("jobs"), status: jobStatus },
  returns: v.null(),
  handler: async (ctx, { id, status }) => {
    const job = await ctx.db.get(id);
    if (!job) throw new ConvexError("NOT_FOUND");
    if (
      job.status === "Archived" &&
      status !== "Draft" &&
      status !== "Archived"
    )
      throw new ConvexError("RESTORE_TO_DRAFT_FIRST");
    jobSchema.parse(
      Object.fromEntries(
        Object.keys(jobFields).map((k) => [k, job[k as keyof typeof job]]),
      ),
    );
    const timestamp = Date.now();
    await ctx.db.patch(id, {
      status,
      updatedAt: timestamp,
      ...(status === "Published" && job.status !== "Published"
        ? { publishedAt: timestamp }
        : {}),
    });
    await syncMetrics(ctx, "jobs", job, await ctx.db.get(id));
    await ctx.db.insert("adminActivity", {
      actor: ctx.actor,
      record: id,
      action: `job_${status.toLowerCase()}`,
      timestamp,
    });
    return null;
  },
});

export const deletionAllowed = adminQuery({
  args: { id: v.id("jobs") },
  returns: v.boolean(),
  handler: async (ctx, { id }) => {
    const linked = await ctx.db
      .query("applications")
      .withIndex("by_jobId", (q) => q.eq("data.jobId", id))
      .first();
    return !linked;
  },
});
export const remove = adminMutation({
  args: { id: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const job = await ctx.db.get(id);
    if (!job) throw new ConvexError("NOT_FOUND");
    const linked = await ctx.db
      .query("applications")
      .withIndex("by_jobId", (q) => q.eq("data.jobId", id))
      .first();
    if (linked) throw new ConvexError("JOB_HAS_APPLICATIONS");
    await syncMetrics(ctx, "jobs", job, null);
    await ctx.db.delete(id);
    await ctx.db.insert("adminActivity", {
      actor: ctx.actor,
      record: id,
      action: "job_deleted",
      timestamp: Date.now(),
    });
    return null;
  },
});
