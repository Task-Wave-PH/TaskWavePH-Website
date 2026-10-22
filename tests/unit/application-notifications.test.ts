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
async function save(t: ReturnType<typeof setup>, jobId?: string) {
  const token = crypto.randomUUID();
  const { website: _website, ...data } = applicationSchema.parse({
    ...(jobId ? { jobId } : {}),
    firstName: "Synthetic",
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
    rateKey: "synthetic",
  });
  await t.mutation(internal.intake.save, {
    kind: "applications",
    token: `applications:${token}`,
    fingerprint: "synthetic",
    data,
  });
  const application = await t.run((ctx) =>
    ctx.db.query("applications").first(),
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
  it("escapes content and generates private dashboard links with Philippine dates", () => {
    const message = applicationEmail({
      id: "synthetic-id",
      reference: "TW-SYNTHETIC",
      role: 'Support <script>alert("x")</script>',
      submittedAt: Date.UTC(2026, 9, 22, 17),
      adminUrl: config.APPLICATION_NOTIFICATION_ADMIN_URL,
    });
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
    expect(message.text).toContain("Oct 23, 2026");
    expect(message.text).toContain(
      "https://admin.taskwaveph.com/applications/synthetic-id",
    );
    expect(message.html).not.toContain("synthetic@example.com");
    expect(
      applicationEmail({
        id: "id",
        reference: "ref",
        role: "Support",
        submittedAt: Date.now(),
        adminUrl: "http://localhost:3000/admin",
      }).text,
    ).toContain("http://localhost:3000/admin/applications/id");
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
  it("saves before enqueueing, deduplicates email jobs, and omits applicant data", async () => {
    configure();
    const t = setup();
    const { application, token } = await save(t);
    expect(
      await t.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").collect(),
      ),
    ).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(0);
    await t.finishInProgressScheduledFunctions();
    await t.mutation(internal.applicationNotifications.enqueue, {
      applicationId: application._id,
    });
    const resend = new Resend(components.resend, {
      apiKey: "synthetic-key",
      testMode: true,
    });
    const emailId = await t.run((ctx) =>
      resend.sendEmail(ctx, {
        from: config.APPLICATION_NOTIFICATION_FROM,
        to: config.APPLICATION_NOTIFICATION_TO,
        subject: "Duplicate must not replace original",
        text: "duplicate",
        idempotencyKey: `application-received:${application._id}`,
      }),
    );
    const queued = await t.query(components.resend.lib.get, { emailId });
    expect(queued!.subject).toBe("New application received — TaskWavePH");
    expect(queued!.to).toEqual(["delivered@resend.dev"]);
    expect(queued!.text).toContain(application.reference);
    expect(queued!.text).not.toContain(application.data.email);
    expect(queued!.html).not.toContain(application.data.phone);
    expect(
      await t.mutation(internal.intake.reserve, {
        kind: "applications",
        token,
        fingerprint: "synthetic",
        rateKey: "synthetic",
      }),
    ).toEqual({ state: "complete", reference: application.reference });
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
  it("keeps the saved application when background enqueue fails", async () => {
    configure();
    const t = setup();
    const { application } = await save(t);
    vi.spyOn(Resend.prototype, "sendEmail").mockRejectedValue(
      new Error("synthetic provider failure"),
    );
    await expect(
      t.mutation(internal.applicationNotifications.enqueue, {
        applicationId: application._id,
      }),
    ).rejects.toThrow("synthetic provider failure");
    expect(await t.run((ctx) => ctx.db.get(application._id))).not.toBeNull();
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
