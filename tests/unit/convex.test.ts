/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { describe, it, expect, vi } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { applicationSchema } from "../../features/applications/schema";
const modules = import.meta.glob("../../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}
const input = {
  firstName: "Maria",
  lastName: "Santos",
  email: "maria@example.com",
  phone: "09171234567",
  location: "Cebu",
  position: "Support",
  privacyConsent: true,
};
const { website: _website, ...data } = applicationSchema.parse(input);
void _website;
async function save(t: ReturnType<typeof setup>, token = crypto.randomUUID()) {
  await t.mutation(internal.intake.reserve, {
    kind: "applications",
    token,
    fingerprint: "fingerprint",
    rateKey: crypto.randomUUID(),
  });
  const reference = await t.mutation(internal.intake.save, {
    kind: "applications",
    token: `applications:${token}`,
    fingerprint: "fingerprint",
    data,
  });
  const row = await t.run((ctx) => ctx.db.query("applications").first());
  return { row: row!, token, reference };
}
async function staff(t: ReturnType<typeof setup>) {
  await t.mutation(internal.provision.setStaff, {
    subject: "user_staff",
    active: true,
  });
  return t.withIdentity({
    subject: "user_staff",
    issuer: "https://clerk.test",
  });
}
const options = {
  kind: "applications" as const,
  paginationOpts: { numItems: 20, cursor: null },
};
describe("Convex intake and administration", () => {
  it("normalizes data, generates a reference and makes retries idempotent", async () => {
    const t = setup();
    const saved = await save(t);
    expect(saved.row.data.phone).toBe("+639171234567");
    expect(saved.reference).toMatch(/^TW-A-/);
    expect(
      await t.mutation(internal.intake.reserve, {
        kind: "applications",
        token: saved.token,
        fingerprint: "fingerprint",
        rateKey: "same",
      }),
    ).toEqual({ state: "complete", reference: saved.reference });
    await expect(
      t.mutation(internal.intake.reserve, {
        kind: "applications",
        token: saved.token,
        fingerprint: "different",
        rateKey: "same",
      }),
    ).rejects.toThrow("TOKEN_CONFLICT");
    expect(
      await t.run((ctx) => ctx.db.query("applications").take(10)),
    ).toHaveLength(1);
  });
  it("reserves concurrent tokens and rejects invalid data at the final boundary", async () => {
    const t = setup();
    const token = crypto.randomUUID();
    const args = {
      kind: "applications" as const,
      token,
      fingerprint: "f",
      rateKey: "ip",
    };
    expect((await t.mutation(internal.intake.reserve, args)).state).toBe(
      "reserved",
    );
    expect((await t.mutation(internal.intake.reserve, args)).state).toBe(
      "busy",
    );
    await expect(
      t.mutation(internal.intake.save, {
        kind: "applications",
        token: `applications:${token}`,
        fingerprint: "f",
        data: { ...data, privacyConsent: false },
      }),
    ).rejects.toThrow();
    expect(
      await t.run((ctx) => ctx.db.query("applications").first()),
    ).toBeNull();
  });
  it("blocks unauthenticated and unapproved callers, including direct backend calls", async () => {
    const t = setup();
    const { row } = await save(t);
    await expect(t.query(api.admin.list, options)).rejects.toThrow(
      "UNAUTHORIZED",
    );
    const outsider = t.withIdentity({ subject: "user_outsider" });
    await expect(
      outsider.query(api.admin.detail, { kind: "applications", id: row._id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      outsider.mutation(api.admin.remove, {
        kind: "applications",
        id: row._id,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      outsider.query(internal.downloads.find, { id: row._id }),
    ).rejects.toThrow("FORBIDDEN");
  });
  it("supports paginated status lists, bounded notes and revocation", async () => {
    const t = setup();
    const admin = await staff(t);
    const { row } = await save(t);
    await admin.mutation(api.admin.update, {
      kind: "applications",
      id: row._id,
      status: "Shortlisted",
      notes: "Review completed",
    });
    expect(
      (await admin.query(api.admin.list, { ...options, status: "Shortlisted" }))
        .page,
    ).toHaveLength(1);
    await expect(
      admin.mutation(api.admin.update, {
        kind: "applications",
        id: row._id,
        status: "Hired",
        notes: "",
      }),
    ).rejects.toThrow("INVALID_STATUS");
    await expect(
      admin.mutation(api.admin.update, {
        kind: "applications",
        id: row._id,
        status: "New",
        notes: "x".repeat(2001),
      }),
    ).rejects.toThrow("NOTES_TOO_LONG");
    const events = await t.run((ctx) => ctx.db.query("adminActivity").take(10));
    expect(events.map((e) => e.action)).toEqual([
      "status_changed",
      "notes_updated",
    ]);
    expect(JSON.stringify(events)).not.toContain("Review completed");
    await t.mutation(internal.provision.setStaff, {
      subject: "user_staff",
      active: false,
    });
    await expect(admin.query(api.admin.list, options)).rejects.toThrow(
      "FORBIDDEN",
    );
  });
  it("removes the resume with its application and records metadata-only deletion", async () => {
    const t = setup();
    const admin = await staff(t);
    const token = crypto.randomUUID();
    await t.mutation(internal.intake.reserve, {
      kind: "applications",
      token,
      fingerprint: "f",
      rateKey: "ip",
    });
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob(["%PDF-test"], { type: "application/pdf" })),
    );
    await t.mutation(internal.intake.attach, {
      token: `applications:${token}`,
      storageId,
    });
    await t.mutation(internal.intake.save, {
      kind: "applications",
      token: `applications:${token}`,
      fingerprint: "f",
      data,
      resumeFile: {
        storageId,
        name: "resume.pdf",
        size: 9,
        contentType: "application/pdf",
      },
    });
    const row = await t.run((ctx) => ctx.db.query("applications").first());
    expect(
      await admin.query(internal.downloads.find, { id: row!._id }),
    ).toMatchObject({ storageId });
    const download = await admin.fetch(`/resume?id=${row!._id}`);
    expect(download.status).toBe(200);
    expect(download.headers.get("content-disposition")).toContain("attachment");
    expect(download.headers.get("cache-control")).toContain("no-store");
    expect(await download.text()).toContain("%PDF-");

    await admin.mutation(api.admin.remove, {
      kind: "applications",
      id: row!._id,
    });
    expect(await t.run((ctx) => ctx.db.get(row!._id))).toBeNull();
    expect(await t.run((ctx) => ctx.storage.get(storageId))).toBeNull();
  });
  it("cleans expired uploads and preserves attached resumes", async () => {
    const t = setup();
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob(["%PDF-test"])),
    );
    await t.run((ctx) =>
      ctx.db.insert("pendingUploads", {
        submissionToken: "old",
        fingerprint: "f",
        expiresAt: 0,
        storageId,
      }),
    );
    await t.mutation(internal.intake.cleanup, {});
    expect(await t.run((ctx) => ctx.storage.get(storageId))).toBeNull();
    expect(
      await t.run((ctx) => ctx.db.query("pendingUploads").first()),
    ).toBeNull();
  });
  it("limits repeated submissions persistently", async () => {
    const t = setup();
    for (let index = 0; index < 5; index++)
      await t.mutation(internal.intake.reserve, {
        kind: "applications",
        token: crypto.randomUUID(),
        fingerprint: "f",
        rateKey: "same-ip",
      });
    await expect(
      t.mutation(internal.intake.reserve, {
        kind: "applications",
        token: crypto.randomUUID(),
        fingerprint: "f",
        rateKey: "same-ip",
      }),
    ).rejects.toThrow("RATE_LIMITED");
  });
  it("rejects unauthenticated HTTP writes and file downloads", async () => {
    const t = setup();
    vi.stubEnv("CONVEX_SERVER_SECRET", "secret");
    expect(
      (await t.fetch("/submit", { method: "POST", body: "bad" })).status,
    ).toBe(401);
    expect((await t.fetch("/resume?id=unknown")).status).toBe(403);
    vi.unstubAllEnvs();
  });
});
