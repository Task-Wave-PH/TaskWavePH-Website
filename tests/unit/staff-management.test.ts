/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.ts");
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
async function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  await t.mutation(internal.provision.setStaff, {
    subject: "user_owner",
    active: true,
    role: "Owner",
  });
  await t.mutation(internal.provision.setStaff, {
    subject: "user_staff",
    active: true,
  });
  return {
    t,
    owner: t.withIdentity({ subject: "user_owner" }),
    staff: t.withIdentity({ subject: "user_staff" }),
    guest: t.withIdentity({ subject: "user_guest" }),
  };
}
async function pending(
  owner: Awaited<ReturnType<typeof setup>>["owner"],
  role: "Owner" | "Staff" = "Staff",
) {
  const row = await owner.mutation(internal.staffManagement.reserve, {
    email: "invited@example.invalid",
    role,
    token: crypto.randomUUID(),
  });
  await owner.mutation(internal.staffManagement.finish, {
    id: row.id,
    clerkId: "inv_test",
  });
  return row;
}
describe("owner-managed staff", () => {
  it("sets a seven-day invitation lifetime and denies acceptance at expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 9, 2));
    const { t, owner, guest } = await setup();
    const row = await pending(owner);
    const stored = await t.run((ctx) => ctx.db.get(row.id));
    expect(stored!.expiresAt - stored!.createdAt).toBe(7 * 86400_000);
    vi.setSystemTime(stored!.expiresAt);
    expect(
      await guest.mutation(internal.staffManagement.accept, {
        id: row.id,
        email: row.email,
        name: "Fixture",
        clerkId: "inv_test",
      }),
    ).toBe(false);
  });
  it("keeps legacy approvals as Staff and rejects non-owner management", async () => {
    const { t, owner, staff, guest } = await setup();
    expect(await staff.query(api.staffManagement.current, {})).toMatchObject({
      role: "Staff",
    });
    for (const caller of [staff, guest, t])
      await expect(
        caller.query(api.staffManagement.list, {
          paginationOpts: { numItems: 20, cursor: null },
        }),
      ).rejects.toThrow();
    expect(
      (
        await owner.query(api.staffManagement.list, {
          paginationOpts: { numItems: 1, cursor: null },
        })
      ).page,
    ).toHaveLength(1);
  });
  it("protects the last owner through public and trusted provisioning paths", async () => {
    const { t, owner } = await setup();
    const row = await t.run((ctx) =>
      ctx.db
        .query("adminUsers")
        .withIndex("by_subject", (q) => q.eq("subject", "user_owner"))
        .unique(),
    );
    for (const change of [
      { active: false, role: "Owner" as const },
      { active: true, role: "Staff" as const },
    ])
      await expect(
        owner.mutation(api.staffManagement.update, {
          id: row!._id,
          expectedRevision: row!.updatedAt!,
          ...change,
        }),
      ).rejects.toThrow("LAST_OWNER");
    await expect(
      t.mutation(internal.provision.setStaff, {
        subject: "user_owner",
        active: false,
      }),
    ).rejects.toThrow("LAST_OWNER");
  });
  it("allows owner changes, rejects stale writes, and revokes permissions immediately", async () => {
    const { t, owner, staff } = await setup();
    const row = await t.run((ctx) =>
      ctx.db
        .query("adminUsers")
        .withIndex("by_subject", (q) => q.eq("subject", "user_staff"))
        .unique(),
    );
    const args = {
      id: row!._id,
      active: true,
      role: "Owner" as const,
      expectedRevision: row!.updatedAt!,
    };
    await owner.mutation(api.staffManagement.update, args);
    await expect(
      owner.mutation(api.staffManagement.update, args),
    ).rejects.toThrow("EDIT_CONFLICT");
    const updated = await t.run((ctx) => ctx.db.get(row!._id));
    await owner.mutation(api.staffManagement.update, {
      ...args,
      active: false,
      expectedRevision: updated!.updatedAt!,
    });
    expect(await staff.query(api.staffStatus.current, {})).toBe(false);
    await expect(
      staff.query(api.staffManagement.list, {
        paginationOpts: { numItems: 20, cursor: null },
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
  it("deduplicates reservations and prevents token payload changes", async () => {
    const { owner } = await setup();
    const token = crypto.randomUUID();
    const args = {
      email: "new@example.invalid",
      role: "Staff" as const,
      token,
    };
    const row = await owner.mutation(internal.staffManagement.reserve, args);
    await expect(
      owner.mutation(internal.staffManagement.reserve, args),
    ).rejects.toThrow("INVITATION_IN_PROGRESS");
    await owner.mutation(internal.staffManagement.finish, {
      id: row.id,
      clerkId: "inv_test",
    });
    expect(
      await owner.mutation(internal.staffManagement.reserve, args),
    ).toMatchObject({ id: row.id, done: true });
    await expect(
      owner.mutation(internal.staffManagement.reserve, {
        ...args,
        role: "Owner",
      }),
    ).rejects.toThrow("INVALID_INVITATION");
    await expect(
      owner.mutation(internal.staffManagement.reserve, {
        ...args,
        token: crypto.randomUUID(),
      }),
    ).rejects.toThrow("INVITATION_EXISTS");
  });
  it("activates the invited role once and never reactivates deactivated accounts", async () => {
    const { t, owner, guest } = await setup();
    const row = await pending(owner, "Owner");
    const args = {
      id: row.id,
      email: row.email,
      name: "Sample staff",
      clerkId: "inv_test",
    };
    expect(
      await guest.mutation(internal.staffManagement.accept, {
        ...args,
        email: "other@example.invalid",
      }),
    ).toBe(false);
    expect(await guest.mutation(internal.staffManagement.accept, args)).toBe(
      true,
    );
    expect(await guest.query(api.staffManagement.current, {})).toMatchObject({
      role: "Owner",
    });
    const record = await t.run((ctx) =>
      ctx.db
        .query("adminUsers")
        .withIndex("by_subject", (q) => q.eq("subject", "user_guest"))
        .unique(),
    );
    await owner.mutation(api.staffManagement.update, {
      id: record!._id,
      active: false,
      role: "Owner",
      expectedRevision: record!.updatedAt!,
    });
    expect(await guest.mutation(internal.staffManagement.accept, args)).toBe(
      false,
    );
    expect((await t.run((ctx) => ctx.db.get(row.id)))!.status).toBe("Accepted");
  });
  it("rejects expired, cancelled, and owner-revoked invitations", async () => {
    for (const change of [
      "expired",
      "exact-expiry",
      "cancelled",
      "owner-revoked",
    ]) {
      const { t, owner, guest } = await setup();
      const row = await pending(owner);
      if (change === "expired")
        await t.run((ctx) =>
          ctx.db.patch(row.id, { expiresAt: Date.now() - 1 }),
        );
      if (change === "exact-expiry") {
        vi.useFakeTimers();
        vi.setSystemTime(Date.UTC(2026, 9, 2));
        await t.run((ctx) => ctx.db.patch(row.id, { expiresAt: Date.now() }));
      }
      if (change === "cancelled")
        await owner.mutation(internal.staffManagement.cancel, { id: row.id });
      if (change === "owner-revoked") {
        await t.mutation(internal.provision.setStaff, {
          subject: "user_second",
          active: true,
          role: "Owner",
        });
        await t.mutation(internal.provision.setStaff, {
          subject: "user_owner",
          active: false,
        });
      }
      expect(
        await guest.mutation(internal.staffManagement.accept, {
          id: row.id,
          email: row.email,
          name: "Test",
          clerkId: "inv_test",
        }),
      ).toBe(false);
      vi.useRealTimers();
    }
  });
  it("reconciles uncertain sends without sending a second email", async () => {
    const { owner } = await setup();
    vi.stubEnv("CLERK_SECRET_KEY", "test-key");
    vi.stubEnv(
      "STAFF_INVITATION_REDIRECT_URL",
      "http://localhost:3000/admin/sign-up",
    );
    const args = {
      email: "new@example.invalid",
      role: "Staff" as const,
      token: crypto.randomUUID(),
    };
    const row = await owner.mutation(internal.staffManagement.reserve, args);
    await owner.mutation(internal.staffManagement.finish, { id: row.id });
    const remote = {
      id: "inv_test",
      email_address: args.email,
      status: "pending",
      public_metadata: { taskwaveStaffInvitation: row.id },
    };
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify([remote]), { status: 200 }),
      );
    expect(await owner.action(api.staffInvitations.invite, args)).toBe(row.id);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]?.method).toBe("GET");
  });
  it("cancels eligibility before a failed Clerk revocation", async () => {
    const { t, owner, guest } = await setup();
    const row = await pending(owner);
    vi.stubEnv("CLERK_SECRET_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("failure", { status: 503 }),
    );
    await expect(
      owner.action(api.staffInvitations.revoke, { id: row.id }),
    ).rejects.toThrow("CLERK_UNAVAILABLE");
    expect((await t.run((ctx) => ctx.db.get(row.id)))!.status).toBe("Revoked");
    expect(
      await guest.mutation(internal.staffManagement.accept, {
        id: row.id,
        email: row.email,
        name: "Test",
        clerkId: "inv_test",
      }),
    ).toBe(false);
  });
  it("accepts only server-verified primary email and trusted invitation metadata", async () => {
    const { owner, guest } = await setup();
    const row = await pending(owner);
    vi.stubEnv("CLERK_SECRET_KEY", "test-key");
    const user = {
      id: "user_guest",
      first_name: "Test",
      last_name: null,
      primary_email_address_id: "mail",
      email_addresses: [
        {
          id: "mail",
          email_address: row.email,
          verification: { status: "unverified" },
        },
      ],
      public_metadata: { taskwaveStaffInvitation: row.id },
      unsafe_metadata: { role: "Owner" },
    };
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        async () => new Response(JSON.stringify(user), { status: 200 }),
      );
    expect(await guest.action(api.staffInvitations.accept, {})).toBe(false);
    user.email_addresses[0].verification.status = "verified";
    expect(await guest.action(api.staffInvitations.accept, {})).toBe(true);
    expect(await guest.action(api.staffInvitations.accept, {})).toBe(true);
    expect(await guest.query(api.staffManagement.current, {})).toMatchObject({
      role: "Staff",
    });
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
