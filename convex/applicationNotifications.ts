import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import {
  applicationEmail,
  getApplicationEmailConfig,
} from "../features/notifications/application-email";

// Scheduled only by real intake, never by seeds or staff edits.
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
    if (!application) return null;
    const resend = new Resend(components.resend, {
      apiKey: config.RESEND_API_KEY,
      testMode: config.RESEND_TEST_MODE === "true",
      retryAttempts: 5,
    });
    await resend.sendEmail(ctx, {
      from: config.APPLICATION_NOTIFICATION_FROM,
      to: config.APPLICATION_NOTIFICATION_TO,
      ...applicationEmail({
        id: applicationId,
        reference: application.reference,
        role: application.data.jobTitle ?? application.data.position,
        submittedAt: application.submittedAt,
        adminUrl: config.APPLICATION_NOTIFICATION_ADMIN_URL,
      }),
      idempotencyKey: `application-received:${applicationId}`,
    });
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
    return null;
  },
});
