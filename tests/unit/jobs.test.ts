/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { describe, it, expect, vi, afterEach } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { jobSchema } from "../../features/jobs/schema";
import { applicationSchema } from "../../features/applications/schema";
import { toCsv } from "../../features/applications/export";
import { previewApplicants } from "../../features/applications/preview-data";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}
async function staff(t: ReturnType<typeof setup>) {
  await t.mutation(internal.provision.setStaff, {
    subject: "user_jobs",
    active: true,
  });
  return t.withIdentity({ subject: "user_jobs" });
}
const data = jobSchema.parse({
  title: "Support Specialist",
  serviceArea: "Customer Support",
  location: "Cebu",
  arrangement: "Remote",
  employmentType: "Full-time",
  description: "Support customers with their questions and everyday concerns.",
  responsibilities: "Respond clearly to customer enquiries.",
  requirements: "Clear communication and relevant experience.",
  salary: "",
});
const page = { paginationOpts: { numItems: 12, cursor: null } };
afterEach(() => vi.unstubAllEnvs());
describe("Jobs", () => {
  it("denies anonymous, unapproved and revoked staff writes", async () => {
    const t = setup();
    await expect(t.mutation(api.jobs.save, { data })).rejects.toThrow(
      "UNAUTHORIZED",
    );
    const denied = t.withIdentity({ subject: "not_approved" });
    await expect(denied.mutation(api.jobs.save, { data })).rejects.toThrow(
      "FORBIDDEN",
    );
    const approved = await staff(t);
    const id = await approved.mutation(api.jobs.save, { data });
    await t.mutation(internal.provision.setStaff, {
      subject: "user_jobs",
      active: false,
    });
    await expect(
      approved.mutation(api.jobs.setStatus, { id, status: "Published" }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(t.query(api.jobs.staffList, page)).rejects.toThrow(
      "UNAUTHORIZED",
    );
  });
  it("keeps drafts and closed roles private, projects public data, audits transitions", async () => {
    const t = setup();
    const admin = await staff(t);
    const id = await admin.mutation(api.jobs.save, { data });
    expect((await t.query(api.jobs.published, page)).page).toHaveLength(0);
    expect(await t.query(api.jobs.detail, { id })).toBeNull();
    await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
    const published = await t.query(api.jobs.detail, { id });
    expect(published?.title).toBe(data.title);
    expect(published).not.toHaveProperty("_creationTime");
    expect((await t.query(api.jobs.published, page)).page).toHaveLength(1);
    await admin.mutation(api.jobs.save, {
      id,
      data: { ...data, title: "Updated Role" },
    });
    await admin.mutation(api.jobs.setStatus, { id, status: "Closed" });
    expect(await t.query(api.jobs.detail, { id })).toBeNull();
    expect((await t.query(api.jobs.published, page)).page).toHaveLength(0);
    expect(await admin.query(api.jobs.staffDetail, { id })).toMatchObject({
      title: "Updated Role",
      status: "Closed",
    });
    const audit = await t.run((ctx) => ctx.db.query("adminActivity").take(10));
    expect(audit).toHaveLength(4);
    expect(JSON.stringify(audit)).not.toContain("Updated Role");
  });
  it("paginates and combines filters with newest publications first", async () => {
    const t = setup();
    const admin = await staff(t);
    for (let i = 0; i < 15; i++) {
      const id = await admin.mutation(api.jobs.save, {
        data: {
          ...data,
          title: `Support ${i}`,
          arrangement: i % 2 ? "Hybrid" : "Remote",
        },
      });
      await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
    }
    const first = await t.query(api.jobs.published, page);
    expect(first.page).toHaveLength(12);
    expect(first.isDone).toBe(false);
    const second = await t.query(api.jobs.published, {
      paginationOpts: { numItems: 12, cursor: first.continueCursor },
    });
    expect(second.page).toHaveLength(3);
    expect(
      new Set([...first.page, ...second.page].map((j) => j._id)).size,
    ).toBe(15);
    const filtered = await t.query(api.jobs.published, {
      ...page,
      serviceArea: "Customer Support",
      arrangement: "Remote",
    });
    expect(filtered.page).toHaveLength(8);
    expect(
      (
        await t.query(api.jobs.published, {
          ...page,
          serviceArea: "Web Development",
        })
      ).page,
    ).toHaveLength(0);
  });
  it("rejects invalid content and safely handles forged ids", async () => {
    const t = setup();
    const admin = await staff(t);
    await expect(
      admin.mutation(api.jobs.save, { data: { ...data, title: "" } }),
    ).rejects.toThrow("INVALID_JOB");
    await expect(
      t.query(api.jobs.published, {
        paginationOpts: { numItems: 101, cursor: null },
      }),
    ).rejects.toThrow();
    expect(await t.query(api.jobs.detail, { id: "forged" })).toBeNull();
  });
  it("links an application to the canonical title and preserves retry after closure", async () => {
    vi.stubEnv("CONVEX_SERVER_SECRET", "jobs-secret");
    const t = setup();
    const admin = await staff(t);
    const id = await admin.mutation(api.jobs.save, { data });
    await admin.mutation(api.jobs.setStatus, { id, status: "Published" });
    const token = crypto.randomUUID();
    const fields = {
      firstName: "Sample",
      lastName: "Applicant",
      email: "sample@example.invalid",
      phone: "09171234567",
      location: "Cebu",
      position: "Forged position",
      privacyConsent: true,
      jobId: id,
      jobTitle: "Forged snapshot",
    };
    const send = async () => {
      const body = new FormData();
      body.set("kind", "applications");
      body.set("fields", JSON.stringify(fields));
      body.set("submissionToken", token);
      return t.fetch("/submit", {
        method: "POST",
        headers: {
          Authorization: "Bearer jobs-secret",
          "x-rate-key": "a".repeat(64),
        },
        body,
      });
    };
    const first = await send();
    expect(first.status).toBe(200);
    const saved = await first.json();
    const app = await t.run((ctx) => ctx.db.query("applications").first());
    expect(app?.data).toMatchObject({
      jobId: id,
      jobTitle: data.title,
      position: data.title,
    });
    await admin.mutation(api.jobs.setStatus, { id, status: "Closed" });
    expect(await (await send()).json()).toEqual(saved);
    const newToken = crypto.randomUUID();
    const body = new FormData();
    body.set("kind", "applications");
    body.set("fields", JSON.stringify(fields));
    body.set("submissionToken", newToken);
    body.set(
      "resumeFile",
      new Blob(["%PDF-1.4\nSynthetic test\n%%EOF"], {
        type: "application/pdf",
      }),
      "test.pdf",
    );
    const denied = await t.fetch("/submit", {
      method: "POST",
      headers: {
        Authorization: "Bearer jobs-secret",
        "x-rate-key": "b".repeat(64),
      },
      body,
    });
    expect(denied.status).toBe(409);
    expect(await denied.json()).toMatchObject({ error: "JOB_UNAVAILABLE" });
    expect(
      await t.run((ctx) => ctx.db.query("pendingUploads").take(10)),
    ).toHaveLength(0);
    expect(
      await t.run((ctx) => ctx.db.system.query("_storage").take(10)),
    ).toHaveLength(0);
  });
  it("rejects forged job associations and leaves general applications compatible", async () => {
    const t = setup();
    const fields = applicationSchema.parse({
      firstName: "Sample",
      lastName: "Applicant",
      email: "sample@example.invalid",
      phone: "09171234567",
      location: "Cebu",
      position: "General",
      privacyConsent: true,
    });
    const { website: _website, ...normalized } = fields;
    void _website;
    const token = crypto.randomUUID();
    await t.mutation(internal.intake.reserve, {
      kind: "applications",
      token,
      fingerprint: "f",
      rateKey: "test",
    });
    await expect(
      t.mutation(internal.intake.save, {
        kind: "applications",
        token: `applications:${token}`,
        fingerprint: "f",
        data: { ...normalized, jobId: "forged" },
      }),
    ).rejects.toThrow("JOB_UNAVAILABLE");
    await t.mutation(internal.intake.save, {
      kind: "applications",
      token: `applications:${token}`,
      fingerprint: "f",
      data: normalized,
    });
    expect(
      (await t.run((ctx) => ctx.db.query("applications").first()))?.data.jobId,
    ).toBeUndefined();
  });
  it("exports associated role information as safe text", () => {
    const row = previewApplicants()[0];
    row.data.jobId = "sample-job";
    row.data.jobTitle = "=malicious";
    const csv = toCsv([row]);
    expect(csv).toContain('"Job Title at Application"');
    expect(csv).toContain('"\'=malicious"');
    expect(csv).toContain('"sample-job"');
  });
});
