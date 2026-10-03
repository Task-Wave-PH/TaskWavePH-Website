/// <reference types="vite/client" />
import { expect, it } from "vitest";
import { convexTest } from "convex-test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import {
  defaultQrSettings,
  qrSettingsSchema,
} from "../../features/settings/qr";
const modules = import.meta.glob("../../convex/**/*.ts");
async function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  await t.run(async (ctx) => {
    for (const [subject, role, active] of [
      ["owner", "Owner", true],
      ["staff", "Staff", true],
      ["inactive", "Owner", false],
    ] as const)
      await ctx.db.insert("adminUsers", { subject, role, active });
  });
  return {
    t,
    owner: t.withIdentity({ subject: "owner" }),
    staff: t.withIdentity({ subject: "staff" }),
  };
}
it("requires active approval for reads and Owner authorization for saves", async () => {
  const { t, owner, staff } = await setup();
  await expect(t.query(api.settings.read, {})).rejects.toThrow("UNAUTHORIZED");
  await expect(
    t.withIdentity({ subject: "visitor" }).query(api.settings.read, {}),
  ).rejects.toThrow("FORBIDDEN");
  await expect(
    t.withIdentity({ subject: "inactive" }).mutation(api.settings.save, {
      value: defaultQrSettings,
      expectedRevision: 0,
    }),
  ).rejects.toThrow("FORBIDDEN");
  await expect(
    staff.mutation(api.settings.save, {
      value: defaultQrSettings,
      expectedRevision: 0,
    }),
  ).rejects.toThrow("OWNER_REQUIRED");
  expect(await owner.query(api.settings.read, {})).toEqual({
    value: defaultQrSettings,
    revision: 0,
  });
  expect(
    await owner.mutation(api.settings.save, {
      value: { ...defaultQrSettings, style: "gradient" },
      expectedRevision: 0,
    }),
  ).toEqual({ saved: true, revision: 1 });
  expect((await staff.query(api.settings.read, {})).value.style).toBe(
    "gradient",
  );
  const audit = await t.run((ctx) => ctx.db.query("adminActivity").take(2));
  expect(audit).toHaveLength(1);
  expect(audit[0]).toMatchObject({
    actor: "owner",
    record: "qr-settings",
    action: "qr_settings_updated",
  });
});
it("rejects stale saves and unsafe colors without changing settings", async () => {
  const { owner } = await setup();
  await owner.mutation(api.settings.save, {
    value: defaultQrSettings,
    expectedRevision: 0,
  });
  await expect(
    owner.mutation(api.settings.save, {
      value: defaultQrSettings,
      expectedRevision: 0,
    }),
  ).rejects.toThrow("STALE_SETTINGS");
  for (const color of ["#FFFFFF", "#00D4FF", "url(https://example.invalid)"])
    await expect(
      owner.mutation(api.settings.save, {
        value: { ...defaultQrSettings, color },
        expectedRevision: 1,
      }),
    ).rejects.toThrow("INVALID_SETTINGS");
  expect((await owner.query(api.settings.read, {})).revision).toBe(1);
});
it("commits the persistent settings budget and allows bounded updates", async () => {
  const { owner } = await setup();
  for (let i = 0; i < 10; i++)
    expect(
      (
        await owner.mutation(api.settings.save, {
          value: defaultQrSettings,
          expectedRevision: i,
        })
      ).saved,
    ).toBe(true);
  expect(
    await owner.mutation(api.settings.save, {
      value: defaultQrSettings,
      expectedRevision: 10,
    }),
  ).toEqual({ saved: false, revision: 10 });
  expect(
    await owner.mutation(api.settings.save, {
      value: defaultQrSettings,
      expectedRevision: 10,
    }),
  ).toEqual({ saved: false, revision: 10 });
});
it("accepts branded dark presets and rejects unsafe style and logo values", () => {
  for (const color of ["#0A1D3B", "#0D6EFD", "#000000"])
    expect(
      qrSettingsSchema.safeParse({ ...defaultQrSettings, color }).success,
    ).toBe(true);
  expect(
    qrSettingsSchema.safeParse({ ...defaultQrSettings, logoSize: 50 }).success,
  ).toBe(false);
  expect(
    qrSettingsSchema.safeParse({
      ...defaultQrSettings,
      logo: "https://example.invalid/image.png",
    }).success,
  ).toBe(false);
});
