import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import {
  applicationEmail,
  getApplicationEmailConfig,
} from "../features/notifications/application-email";

const WINDOW_MS = 5 * 60 * 1000;
// Above normal five-minute intake budgets, while bounding reads/document size.
const MAX_BATCH = 250;
// Only real intake schedules this function; historical records and seeds do not.
export const enqueue = internalMutation({
  args: { applicationId: v.id("applications") },
  returns: v.null(),
  handler: async (ctx, { applicationId }) => {
    const config = getApplicationEmailConfig(process.env);
    if (config.state === "disabled") return null;
    if (config.state === "invalid") {
      console.error("Application notification unavailable", {
        code: "CONFIGURATION_INVALID",
      });
      return null;
    }
    const application = await ctx.db.get(applicationId);
    if (!application || application.notificationBatchId) return null;
    const now = Date.now();
    const active = await ctx.db
      .query("applicationNotificationBatches")
      .withIndex("by_state", (q) => q.eq("state", "collecting"))
      .order("desc")
      .first();
    let batchId;
    if (
      active &&
      active.closesAt > now &&
      active.applicationIds.length < MAX_BATCH
    ) {
      batchId = active._id;
      await ctx.db.patch(batchId, {
        applicationIds: [...active.applicationIds, applicationId],
      });
    } else {
      if (active) await ctx.db.patch(active._id, { state: "sealed" });
      batchId = await ctx.db.insert("applicationNotificationBatches", {
        state: "collecting",
        closesAt: now + WINDOW_MS,
        applicationIds: [applicationId],
      });
      await ctx.scheduler.runAt(
        now + WINDOW_MS,
        internal.applicationNotifications.flush,
        { batchId },
      );
    }
    await ctx.db.patch(applicationId, { notificationBatchId: batchId });
    return null;
  },
});
export const flush = internalMutation({
  args: { batchId: v.id("applicationNotificationBatches") },
  returns: v.null(),
  handler: async (ctx, { batchId }) => {
    const batch = await ctx.db.get(batchId);
    if (
      !batch ||
      (batch.state !== "collecting" && batch.state !== "sealed") ||
      batch.closesAt > Date.now()
    )
      return null;
    const config = getApplicationEmailConfig(process.env);
    if (config.state !== "ready") {
      if (config.state === "invalid")
        console.error("Application notification unavailable", {
          code: "CONFIGURATION_INVALID",
        });
      await ctx.db.patch(batchId, { state: "skipped" });
      return null;
    }
    const loaded = await Promise.all(
      batch.applicationIds.map((id) => ctx.db.get(id)),
    );
    const applications = loaded.filter(
      (row): row is Doc<"applications"> =>
        row !== null && row.notificationBatchId === batchId,
    );
    if (!applications.length) {
      await ctx.db.patch(batchId, { state: "skipped" });
      return null;
    }
    applications.sort(
      (a, b) =>
        b.submittedAt - a.submittedAt ||
        b._creationTime - a._creationTime ||
        b._id.localeCompare(a._id),
    );
    const resend = new Resend(components.resend, {
      apiKey: config.RESEND_API_KEY,
      testMode: config.RESEND_TEST_MODE === "true",
      retryAttempts: 5,
    });
    await resend.sendEmail(ctx, {
      from: config.APPLICATION_NOTIFICATION_FROM,
      to: config.APPLICATION_NOTIFICATION_TO,
      ...applicationEmail({
        names: applications
          .slice(0, 3)
          .map((row) => `${row.data.firstName} ${row.data.lastName}`.trim()),
        total: applications.length,
        adminUrl: config.APPLICATION_NOTIFICATION_ADMIN_URL,
      }),
      idempotencyKey: `application-batch:${batchId}`,
    });
    await ctx.db.patch(batchId, { state: "queued" });
    return null;
  },
});
export const cleanup = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: 7 * 24 * 60 * 60 * 1000,
    });
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      { olderThan: 28 * 24 * 60 * 60 * 1000 },
    );
    const expired = await ctx.db
      .query("applicationNotificationBatches")
      .withIndex("by_closesAt", (q) =>
        q.lt("closesAt", Date.now() - 7 * 24 * 60 * 60 * 1000),
      )
      .take(100);
    for (const row of expired) await ctx.db.delete(row._id);
    if (expired.length === 100)
      await ctx.scheduler.runAfter(
        0,
        internal.applicationNotifications.cleanup,
        {},
      );
    return null;
  },
});
