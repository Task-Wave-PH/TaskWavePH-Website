/// <reference types="vite/client" />
import { readFileSync } from "node:fs";
import { it, expect } from "vitest";
import { convexTest } from "convex-test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { defaultQrSettings } from "../../features/settings/qr";
import { validateQrPng } from "../../features/settings/png";
const modules = import.meta.glob("../../convex/**/*.ts");
const png = Uint8Array.from(
  readFileSync("public/logo/taskwaveph-symbol.png"),
).buffer;
async function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  await t.run(async (ctx) => {
    await ctx.db.insert("adminUsers", {
      subject: "owner",
      active: true,
      role: "Owner",
    });
    await ctx.db.insert("adminUsers", {
      subject: "staff",
      active: true,
      role: "Staff",
    });
  });
  return {
    t,
    owner: t.withIdentity({ subject: "owner" }),
    staff: t.withIdentity({ subject: "staff" }),
  };
}
it("validates actual PNG structure, CRCs, bounds and rejects disguised/trailing files", () => {
  expect(validateQrPng(new Uint8Array(png))).toBe(true);
  expect(validateQrPng(new TextEncoder().encode("<svg></svg>"))).toBe(false);
  const corrupted = new Uint8Array(png.slice(0));
  corrupted[40] ^= 1;
  expect(validateQrPng(corrupted)).toBe(false);
  expect(validateQrPng(new Uint8Array(png.slice(0, 60)))).toBe(false);
  const appended = new Uint8Array(png.byteLength + 1);
  appended.set(new Uint8Array(png));
  expect(validateQrPng(appended)).toBe(false);
  expect(validateQrPng(new Uint8Array(1024 * 1024 + 1))).toBe(false);
});
it("stores PNGs only for Owners and exposes only approval-protected reads", async () => {
  const { t, owner, staff } = await setup();
  const args = {
    value: { ...defaultQrSettings, logo: "custom" as const },
    expectedRevision: 0,
    png,
  };
  await expect(t.action(api.qrLogos.save, args)).rejects.toThrow(
    "UNAUTHORIZED",
  );
  await expect(staff.action(api.qrLogos.save, args)).rejects.toThrow(
    "OWNER_REQUIRED",
  );
  await expect(
    owner.mutation(api.settings.save, {
      value: args.value,
      expectedRevision: 0,
    }),
  ).rejects.toThrow("MISSING_LOGO");
  expect(await owner.action(api.qrLogos.save, args)).toEqual({
    saved: true,
    revision: 1,
  });
  const id = await staff.query(internal.qrLogos.find, {});
  expect(id).toBeTruthy();
  await expect(t.query(internal.qrLogos.find, {})).rejects.toThrow(
    "UNAUTHORIZED",
  );
  const blob = await t.run(async (ctx) => {
    const file = await ctx.storage.get(id!);
    return file ? { type: file.type, size: file.size } : null;
  });
  expect(blob?.type).toBe("image/png");
  expect(blob?.size).toBe(png.byteLength);
  expect((await staff.query(api.settings.read, {})).value.logo).toBe("custom");
});
it("stale uploads are deleted and replacement/reset delete previous logos", async () => {
  const { t, owner } = await setup();
  const value = { ...defaultQrSettings, logo: "custom" as const };
  await owner.action(api.qrLogos.save, { value, expectedRevision: 0, png });
  const first = await owner.query(internal.qrLogos.find, {});
  await expect(
    owner.action(api.qrLogos.save, { value, expectedRevision: 0, png }),
  ).rejects.toThrow("STALE_SETTINGS");
  await owner.action(api.qrLogos.save, { value, expectedRevision: 1, png });
  const second = await owner.query(internal.qrLogos.find, {});
  expect(second).not.toBe(first);
  expect(await t.run((ctx) => ctx.storage.get(first!))).toBeNull();
  await owner.mutation(api.settings.save, {
    value: defaultQrSettings,
    expectedRevision: 2,
  });
  expect(await t.run((ctx) => ctx.storage.get(second!))).toBeNull();
  expect(await owner.query(internal.qrLogos.find, {})).toBeNull();
});
it("cleanup protects the saved logo and is idempotent for unlinked files", async () => {
  const { t, owner } = await setup();
  await owner.action(api.qrLogos.save, {
    value: { ...defaultQrSettings, logo: "custom" },
    expectedRevision: 0,
    png,
  });
  const id = await owner.query(internal.qrLogos.find, {});
  await t.mutation(internal.qrLogos.cleanup, { storageId: id! });
  expect(await owner.query(internal.qrLogos.find, {})).toBe(id);
  await owner.mutation(api.settings.save, {
    value: defaultQrSettings,
    expectedRevision: 1,
  });
  await t.mutation(internal.qrLogos.cleanup, { storageId: id! });
});
