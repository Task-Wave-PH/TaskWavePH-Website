import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireOwner } from "./adminAccess";
import { qrSettings } from "./settingsValidators";
import { validateQrPng } from "../features/settings/png";
export const find = internalQuery({
  args: {},
  returns: v.union(v.id("_storage"), v.null()),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const row = await ctx.db
      .query("ownerSettings")
      .withIndex("by_key", (q) => q.eq("key", "qr"))
      .unique();
    return row?.value.logo === "custom" ? (row.logoStorageId ?? null) : null;
  },
});
export const owner = internalQuery({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireOwner(ctx);
    return null;
  },
});
export const cleanup = internalMutation({
  args: { storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, { storageId }) => {
    const row = await ctx.db
      .query("ownerSettings")
      .withIndex("by_key", (q) => q.eq("key", "qr"))
      .unique();
    if (
      row?.logoStorageId !== storageId &&
      (await ctx.db.system.get(storageId))
    )
      await ctx.storage.delete(storageId);
    return null;
  },
});
export const save = action({
  args: { value: qrSettings, expectedRevision: v.number(), png: v.bytes() },
  returns: v.object({ saved: v.boolean(), revision: v.number() }),
  handler: async (ctx, args): Promise<{ saved: boolean; revision: number }> => {
    await ctx.runQuery(internal.qrLogos.owner, {});
    const allowed = await ctx.runMutation(internal.settings.uploadPermit, {});
    if (!allowed) return { saved: false, revision: args.expectedRevision };
    if (
      args.value.logo !== "custom" ||
      !validateQrPng(new Uint8Array(args.png))
    )
      throw new ConvexError("INVALID_PNG");
    const storageId = await ctx.storage.store(
      new Blob([args.png], { type: "image/png" }),
    );
    let committed = false;
    try {
      await ctx.scheduler.runAfter(60 * 60 * 1000, internal.qrLogos.cleanup, {
        storageId,
      });
      const result = await ctx.runMutation(internal.settings.saveLogo, {
        value: args.value,
        expectedRevision: args.expectedRevision,
        storageId,
      });
      committed = result.saved;
      return result;
    } finally {
      if (!committed)
        await ctx.runMutation(internal.qrLogos.cleanup, { storageId });
    }
  },
});
