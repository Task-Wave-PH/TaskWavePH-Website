import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { adminQuery } from "./adminAccess";
import { byTime, byStatus, syncMetrics } from "./adminMetrics";
import { dateKey, dayStart, manilaDay } from "../features/admin/metrics";

const kinds = ["applications", "businessLeads", "jobs"] as const;
const statusCount = v.object({ status: v.string(), count: v.number() });
export const summary = adminQuery({
  args: {
    days: v.union(v.literal(7), v.literal(30), v.literal(90)),
    day: v.number(),
  },
  returns: v.object({
    ready: v.boolean(),
    applications: v.array(statusCount),
    leads: v.array(statusCount),
    jobs: v.array(statusCount),
    priorityLeads: v.number(),
    overdueLeads: v.number(),
    activity: v.array(
      v.object({
        date: v.string(),
        applications: v.number(),
        leads: v.number(),
      }),
    ),
    recent: v.array(
      v.object({ id: v.string(), action: v.string(), timestamp: v.number() }),
    ),
  }),
  handler: async (ctx, { days, day }) => {
    const today = manilaDay(Date.now());
    if (!Number.isInteger(day) || Math.abs(day - today) > 1)
      throw new ConvexError("INVALID_DAY");
    const state = await ctx.db
      .query("dashboardState")
      .withIndex("by_key", (q) => q.eq("key", "overview-v1"))
      .unique();
    if (!state?.ready)
      return {
        ready: false,
        applications: [],
        leads: [],
        jobs: [],
        priorityLeads: 0,
        overdueLeads: 0,
        activity: [],
        recent: [],
      };
    const staff = await ctx.db
      .query("adminUsers")
      .withIndex("by_subject", (q) => q.eq("subject", ctx.actor))
      .unique();
    const counts = async (namespace: string, statuses: string[]) => {
      const values = await byStatus.countBatch(
        ctx,
        statuses.map((status) => ({
          namespace,
          bounds: {
            lower: { key: status, inclusive: true },
            upper: { key: status, inclusive: true },
          },
        })),
      );
      return statuses.map((status, i) => ({ status, count: values[i] }));
    };
    const buckets = (namespace: string) =>
      byTime.countBatch(
        ctx,
        Array.from({ length: days }, (_, i) => {
          const d = today - days + i + 1;
          return {
            namespace,
            bounds: {
              lower: { key: dayStart(d), inclusive: true },
              upper: { key: dayStart(d + 1), inclusive: false },
            },
          };
        }),
      );
    const [
      applications,
      leads,
      jobs,
      appDays,
      leadDays,
      priorityLeads,
      overdueLeads,
      recent,
    ] = await Promise.all([
      counts("applications", ["New", "Reviewed", "Shortlisted", "Closed"]),
      counts("businessLeads", ["New", "Contacted", "Closed"]),
      counts("jobs", ["Draft", "Published", "Closed", "Archived"]),
      buckets("applications"),
      buckets("businessLeads"),
      byStatus.count(ctx, { namespace: "priorityLeads" }),
      byTime.count(ctx, {
        namespace: "leadFollowUp",
        bounds: { upper: { key: dayStart(today), inclusive: false } },
      }),
      staff?.role === "Owner"
        ? ctx.db
            .query("adminActivity")
            .withIndex("by_timestamp")
            .order("desc")
            .take(8)
        : Promise.resolve([]),
    ]);
    return {
      ready: true,
      applications,
      leads,
      jobs,
      priorityLeads,
      overdueLeads,
      activity: appDays.map((count, i) => ({
        date: dateKey(today - days + i + 1),
        applications: count,
        leads: leadDays[i],
      })),
      recent: recent.map((row) => ({
        id: row._id,
        action: row.action,
        timestamp: row.timestamp,
      })),
    };
  },
});

// Trusted CLI only. Deploy live synchronization before starting this migration.
export const startBackfill = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const state = await ctx.db
      .query("dashboardState")
      .withIndex("by_key", (q) => q.eq("key", "overview-v1"))
      .unique();
    if (state?.ready) return null;
    if (!state)
      await ctx.db.insert("dashboardState", {
        key: "overview-v1",
        ready: false,
      });
    await ctx.scheduler.runAfter(0, internal.overview.backfill, {
      table: 0,
      cursor: null,
    });
    return null;
  },
});
export const backfill = internalMutation({
  args: { table: v.number(), cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { table, cursor }) => {
    if (!Number.isInteger(table) || table < 0 || table > 2)
      throw new Error("Invalid backfill table");
    const kind = kinds[table];
    const page = await ctx.db.query(kind).paginate({ cursor, numItems: 25 });
    for (const row of page.page) await syncMetrics(ctx, kind, null, row);
    if (!page.isDone)
      await ctx.scheduler.runAfter(0, internal.overview.backfill, {
        table,
        cursor: page.continueCursor,
      });
    else if (table < 2)
      await ctx.scheduler.runAfter(0, internal.overview.backfill, {
        table: table + 1,
        cursor: null,
      });
    else {
      const state = await ctx.db
        .query("dashboardState")
        .withIndex("by_key", (q) => q.eq("key", "overview-v1"))
        .unique();
      if (state) await ctx.db.patch(state._id, { ready: true });
    }
    return null;
  },
});
