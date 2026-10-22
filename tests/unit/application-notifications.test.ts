/// <reference types="vite/client" />
import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import aggregate from "@convex-dev/aggregate/test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import resendTest from "@convex-dev/resend/test";
import { Resend } from "@convex-dev/resend";
import { createHmac } from "node:crypto";
import schema from "../../convex/schema";
import { internal, components } from "../../convex/_generated/api";
import { leadSchema } from "../../features/leads/schema";
import { applicationSchema } from "../../features/applications/schema";
import {
  applicationEmail,
  getApplicationEmailConfig,
} from "../../features/notifications/application-email";
const modules = import.meta.glob("../../convex/**/*.ts");
const config = {
  APPLICATION_NOTIFICATIONS_ENABLED: "true",
  APPLICATION_NOTIFICATION_TO: "delivered@resend.dev",
  APPLICATION_NOTIFICATION_FROM:
    "TaskWavePH Recruitment <notifications@notify.taskwaveph.com>",
  APPLICATION_NOTIFICATION_ADMIN_URL: "https://admin.taskwaveph.com",
  RESEND_API_KEY: "synthetic-key",
  RESEND_TEST_MODE: "true",
};
function setup() {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  aggregate.register(t, "adminByTime");
  aggregate.register(t, "adminByStatus");
  resendTest.register(t);
  return t;
}
function configure() {
  for (const [key, value] of Object.entries(config)) vi.stubEnv(key, value);
}
async function save(
  t: ReturnType<typeof setup>,
  jobId?: string,
  firstName = "Synthetic",
) {
  const token = crypto.randomUUID();
  const { website: _website, ...data } = applicationSchema.parse({
    ...(jobId ? { jobId } : {}),
    firstName,
    lastName: "Applicant",
    email: "synthetic@example.com",
    phone: "09171234567",
    location: "Dagupan",
    position: "Support",
    privacyConsent: true,
  });
  void _website;
  await t.mutation(internal.intake.reserve, {
    kind: "applications",
    token,
    fingerprint: "synthetic",
    rateKey: crypto.randomUUID(),
  });
  await t.mutation(internal.intake.save, {
    kind: "applications",
    token: `applications:${token}`,
    fingerprint: "synthetic",
    data,
  });
  const application = await t.run((ctx) =>
    ctx.db
      .query("applications")
      .withIndex("by_submissionToken", (q) =>
        q.eq("submissionToken", `applications:${token}`),
      )
      .unique(),
  );
  return { application: application!, token };
}
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("application notification emails", () => {
  it("defaults to disabled and protects test recipients and administration URLs", () => {
    expect(getApplicationEmailConfig({})).toEqual({ state: "disabled" });
    expect(getApplicationEmailConfig(config).state).toBe("ready");
    for (const patch of [
      { RESEND_API_KEY: "" },
      { APPLICATION_NOTIFICATION_TO: "franzhbataan@gmail.com" },
      {
        APPLICATION_NOTIFICATION_ADMIN_URL:
          "https://admin.taskwaveph.com?token=private",
      },
      { APPLICATION_NOTIFICATION_ADMIN_URL: "http://admin.taskwaveph.com" },
    ])
      expect(getApplicationEmailConfig({ ...config, ...patch }).state).toBe(
        "invalid",
      );
    expect(
      getApplicationEmailConfig({
        ...config,
        RESEND_TEST_MODE: "false",
        APPLICATION_NOTIFICATION_TO: "franzhbataan@gmail.com",
      }).state,
    ).toBe("ready");
  });
  it("escapes names, shows at most three, and links to protected applications", () => {
    const message = applicationEmail({
      names: [
        'Applicant <script>alert("x")</script>',
        "Second Applicant",
        "Third Applicant",
        "Hidden Fourth",
      ],
      total: 4,
      adminUrl: config.APPLICATION_NOTIFICATION_ADMIN_URL,
    });
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
    expect(message.text).toContain("+1 more new applicant");
    expect(message.text).not.toContain("Hidden Fourth");
    expect(message.subject).toBe("4 new applications — TaskWavePH");
    expect(message.text).toContain("https://admin.taskwaveph.com/applications");
    expect(
      applicationEmail({
        names: ["One Applicant"],
        total: 1,
        adminUrl: "http://localhost:3000/admin",
      }).text,
    ).toContain("http://localhost:3000/admin/applications");
    expect(() =>
      applicationEmail({
        names: [],
        total: 0,
        adminUrl: config.APPLICATION_NOTIFICATION_ADMIN_URL,
      }),
    ).toThrow("empty");
  });
  it("keeps disabled intake free of notification jobs", async () => {
    vi.stubEnv("APPLICATION_NOTIFICATIONS_ENABLED", "false");
    const t = setup();
    await save(t);
    expect(
      await t.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").collect(),
      ),
    ).toHaveLength(0);
  });
  it("does not schedule a notification for an unavailable job", async () => {
    configure();
    const t = setup();
    const jobId = await t.run((ctx) =>
      ctx.db.insert("jobs", {
        title: "Synthetic draft",
        serviceArea: "Customer Support",
        location: "Dagupan",
        arrangement: "Remote",
        employmentType: "Full-time",
        description: "Synthetic development job description.",
        responsibilities: "Support the sample team.",
        requirements: "Sample communication skills.",
        salary: "",
        status: "Draft",
        updatedAt: Date.now(),
      }),
    );
    await expect(save(t, jobId)).rejects.toThrow("JOB_UNAVAILABLE");
    expect(
      await t.run((ctx) => ctx.db.query("applications").collect()),
    ).toHaveLength(0);
    expect(
      await t.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").collect(),
      ),
    ).toHaveLength(0);
  });
  it("does not schedule application mail for business enquiries", async () => {
    configure();
    const t = setup();
    const token = crypto.randomUUID();
    const { website: _website, ...data } = leadSchema.parse({
      company: "Synthetic company",
      contactName: "Synthetic contact",
      email: "synthetic@example.com",
      services: ["Customer Support"],
      message: "Synthetic enquiry for testing only.",
      privacyConsent: true,
    });
    void _website;
    await t.mutation(internal.intake.reserve, {
      kind: "businessLeads",
      token,
      fingerprint: "synthetic",
      rateKey: "synthetic",
    });
    await t.mutation(internal.intake.save, {
      kind: "businessLeads",
      token: `businessLeads:${token}`,
      fingerprint: "synthetic",
      data,
    });
    expect(
      await t.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").collect(),
      ),
    ).toHaveLength(0);
  });
  it("waits five minutes, sends once, and preserves application retry idempotency", async () => {
    configure();
    const t = setup();
    const { application, token } = await save(t);
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    await t.mutation(internal.applicationNotifications.enqueue, {
      applicationId: application._id,
    });
    const batches = await t.run((ctx) =>
      ctx.db.query("applicationNotificationBatches").collect(),
    );
    expect(batches).toHaveLength(1);
    expect(batches[0].applicationIds).toEqual([application._id]);
    const send = vi.spyOn(Resend.prototype, "sendEmail");
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 - 1);
    await t.finishInProgressScheduledFunctions();
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await t.finishInProgressScheduledFunctions();
    expect(send).toHaveBeenCalledTimes(1);
    const emailId = send.mock.results[0].value;
    const queued = await t.query(components.resend.lib.get, {
      emailId: await emailId,
    });
    expect(queued!.subject).toBe("1 new application — TaskWavePH");
    expect(queued!.text).toContain("Synthetic Applicant");
    expect(queued!.text).not.toContain(application.data.email);
    expect(queued!.html).not.toContain(application.data.phone);
    await t.mutation(internal.applicationNotifications.flush, {
      batchId: batches[0]._id,
    });
    await t.mutation(internal.applicationNotifications.enqueue, {
      applicationId: application._id,
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(
      await t.mutation(internal.intake.reserve, {
        kind: "applications",
        token,
        fingerprint: "synthetic",
        rateKey: "synthetic",
      }),
    ).toEqual({ state: "complete", reference: application.reference });
  });
  it("groups new arrivals, shows the latest three, and sends nothing in quiet periods", async () => {
    configure();
    const t = setup();
    const send = vi
      .spyOn(Resend.prototype, "sendEmail")
      .mockResolvedValue(
        "synthetic-email" as Awaited<ReturnType<Resend["sendEmail"]>>,
      );
    for (const name of ["First", "Second", "Third", "Fourth"]) {
      await save(t, undefined, name);
      await vi.advanceTimersByTimeAsync(1);
      await t.finishInProgressScheduledFunctions();
    }
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    await t.finishInProgressScheduledFunctions();
    expect(send).toHaveBeenCalledTimes(1);
    const message = send.mock.calls[0][1];
    expect(message).toMatchObject({
      subject: "4 new applications — TaskWavePH",
    });
    expect(JSON.stringify(message)).toContain("Fourth Applicant");
    expect(JSON.stringify(message)).not.toContain("First Applicant");
    expect(JSON.stringify(message)).toContain("+1 more new applicant");
    await vi.advanceTimersByTimeAsync(15 * 60 * 1000);
    await t.finishInProgressScheduledFunctions();
    expect(send).toHaveBeenCalledTimes(1);
    await save(t, undefined, "Fifth");
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    await t.finishInProgressScheduledFunctions();
    expect(send).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(send.mock.calls[1][1])).toContain("Fifth Applicant");
    expect(JSON.stringify(send.mock.calls[1][1])).not.toContain(
      "Fourth Applicant",
    );
  });
  it("sends no email when all applicants in a batch have been deleted", async () => {
    configure();
    const t = setup();
    const send = vi.spyOn(Resend.prototype, "sendEmail");
    const { application } = await save(t);
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    await t.run((ctx) => ctx.db.delete(application._id));
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    await t.finishInProgressScheduledFunctions();
    expect(send).not.toHaveBeenCalled();
    expect(
      (
        await t.run((ctx) =>
          ctx.db.query("applicationNotificationBatches").first(),
        )
      )?.state,
    ).toBe("skipped");
  });
  it("skips a pending group if notifications are turned off before the deadline", async () => {
    configure();
    const t = setup();
    const send = vi.spyOn(Resend.prototype, "sendEmail");
    await save(t);
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    vi.stubEnv("APPLICATION_NOTIFICATIONS_ENABLED", "false");
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    await t.finishInProgressScheduledFunctions();
    expect(send).not.toHaveBeenCalled();
    expect(
      (
        await t.run((ctx) =>
          ctx.db.query("applicationNotificationBatches").first(),
        )
      )?.state,
    ).toBe("skipped");
  });
  it("does not re-group previously notified applicants after batch history cleanup", async () => {
    configure();
    const t = setup();
    const send = vi
      .spyOn(Resend.prototype, "sendEmail")
      .mockResolvedValue(
        "synthetic-email" as Awaited<ReturnType<Resend["sendEmail"]>>,
      );
    const { application } = await save(t);
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    await t.finishInProgressScheduledFunctions();
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);
    await t.mutation(internal.applicationNotifications.cleanup, {});
    await t.mutation(internal.applicationNotifications.enqueue, {
      applicationId: application._id,
    });
    expect(
      await t.run((ctx) =>
        ctx.db.query("applicationNotificationBatches").collect(),
      ),
    ).toHaveLength(0);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("seals full batches and keeps one collecting group for overflow arrivals", async () => {
    configure();
    const t = setup();
    const { application } = await save(t);
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    const batch = await t.run((ctx) =>
      ctx.db.query("applicationNotificationBatches").first(),
    );
    await t.run(async (ctx) => {
      const { _id, _creationTime, ...base } = application;
      void _id;
      void _creationTime;
      const ids = [application._id];
      for (let index = 1; index < 250; index++)
        ids.push(
          await ctx.db.insert("applications", {
            ...base,
            reference: `TW-SYNTHETIC-${index}`,
            submissionToken: `synthetic-batch-cap:${index}`,
            notificationBatchId: batch!._id,
          }),
        );
      await ctx.db.patch(batch!._id, { applicationIds: ids });
    });
    await save(t, undefined, "OverflowOne");
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    await save(t, undefined, "OverflowTwo");
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    const batches = await t.run((ctx) =>
      ctx.db.query("applicationNotificationBatches").collect(),
    );
    expect(batches.filter((row) => row.state === "sealed")).toHaveLength(1);
    const collecting = batches.filter((row) => row.state === "collecting");
    expect(collecting).toHaveLength(1);
    expect(collecting[0].applicationIds).toHaveLength(2);
  });
  it("retains saved applications if notification configuration fails", async () => {
    configure();
    vi.stubEnv("RESEND_API_KEY", "");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const t = setup();
    const { application } = await save(t);
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    expect(log).toHaveBeenCalledWith("Application notification unavailable", {
      code: "CONFIGURATION_INVALID",
    });
    expect(await t.run((ctx) => ctx.db.get(application._id))).not.toBeNull();
  });
  it("preserves the collecting batch and saved applications if enqueue fails", async () => {
    configure();
    const t = setup();
    const { application } = await save(t);
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    const batch = await t.run((ctx) =>
      ctx.db.query("applicationNotificationBatches").first(),
    );
    vi.setSystemTime(batch!.closesAt);
    const send = vi
      .spyOn(Resend.prototype, "sendEmail")
      .mockRejectedValue(new Error("synthetic failure"));
    await expect(
      t.mutation(internal.applicationNotifications.flush, {
        batchId: batch!._id,
      }),
    ).rejects.toThrow("synthetic failure");
    expect((await t.run((ctx) => ctx.db.get(batch!._id)))?.state).toBe(
      "collecting",
    );
    expect(await t.run((ctx) => ctx.db.get(application._id))).not.toBeNull();
    send.mockResolvedValue(
      "synthetic-email" as Awaited<ReturnType<Resend["sendEmail"]>>,
    );
    await t.mutation(internal.applicationNotifications.flush, {
      batchId: batch!._id,
    });
    expect((await t.run((ctx) => ctx.db.get(batch!._id)))?.state).toBe(
      "queued",
    );
  });
  it("rejects unsigned and oversized webhooks without exposing diagnostics", async () => {
    vi.stubEnv("RESEND_WEBHOOK_SECRET", `whsec_${btoa("synthetic-secret")}`);
    const t = setup();
    const invalid = await t.fetch("/resend-webhook", {
      method: "POST",
      body: "{}",
    });
    expect(invalid.status).toBe(400);
    expect(invalid.headers.get("cache-control")).toBe("private, no-store");
    expect(
      (
        await t.fetch("/resend-webhook", {
          method: "POST",
          body: "x".repeat(256 * 1024 + 1),
        })
      ).status,
    ).toBe(413);
  });
  it("reports component processing failures as unavailable without diagnostics", async () => {
    vi.stubEnv("RESEND_WEBHOOK_SECRET", `whsec_${btoa("synthetic-secret")}`);
    const t = setup();
    vi.spyOn(Resend.prototype, "handleResendEventWebhook").mockRejectedValue(
      new Error("synthetic private diagnostic"),
    );
    const response = await t.fetch("/resend-webhook", {
      method: "POST",
      body: "{}",
    });
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("Webhook unavailable");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("accepts verified delivery events through the component", async () => {
    const secret = `whsec_${btoa("synthetic-secret")}`;
    vi.stubEnv("RESEND_WEBHOOK_SECRET", secret);
    const t = setup();
    const emailId = await t.mutation(components.resend.lib.createManualEmail, {
      from: config.APPLICATION_NOTIFICATION_FROM,
      to: config.APPLICATION_NOTIFICATION_TO,
      subject: "Synthetic delivery check",
    });
    await t.mutation(components.resend.lib.updateManualEmail, {
      emailId,
      status: "sent",
      resendId: "synthetic-provider-id",
    });
    const body = JSON.stringify({
      type: "email.delivered",
      created_at: new Date().toISOString(),
      data: {
        email_id: "synthetic-provider-id",
        from: config.APPLICATION_NOTIFICATION_FROM,
        to: [config.APPLICATION_NOTIFICATION_TO],
        subject: "Synthetic delivery check",
        created_at: new Date().toISOString(),
      },
    });
    const id = "msg_synthetic";
    const timestamp = new Date();
    const digest = createHmac("sha256", Buffer.from("synthetic-secret"))
      .update(`${id}.${Math.floor(timestamp.getTime() / 1000)}.${body}`)
      .digest("base64");
    const signature = `v1,${digest}`;
    const response = await t.fetch("/resend-webhook", {
      method: "POST",
      body,
      headers: {
        "svix-id": id,
        "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
        "svix-signature": signature,
      },
    });
    expect(response.status).toBe(201);
    expect(
      (await t.query(components.resend.lib.getStatus, { emailId }))?.status,
    ).toBe("delivered");
  });
});
