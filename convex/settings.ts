import { ConvexError, v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import { requireAdmin, requireOwner } from "./adminAccess";
import type { Id } from "./_generated/dataModel";
import { qrSettings } from "./settingsValidators";
import { qrSettingsSchema, defaultQrSettings } from "../features/settings/qr";
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
const limiter = new RateLimiter(components.rateLimiter, {
  settings: { kind: "fixed window", rate: 10, period: MINUTE },
  logoUploads: { kind: "fixed window", rate: 10, period: MINUTE },
});
export const read = query({
  args: {},
  returns: v.object({ value: qrSettings, revision: v.number() }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const row = await ctx.db
      .query("ownerSettings")
      .withIndex("by_key", (q) => q.eq("key", "qr"))
      .unique();
    return {
      value: row?.value ?? defaultQrSettings,
      revision: row?.revision ?? 0,
    };
  },
});
async function commit(
  ctx: MutationCtx,
  args: {
    value: import("../features/settings/qr").QrSettings;
    expectedRevision: number;
    storageId?: Id<"_storage">;
  },
) {
  const actor = await requireOwner(ctx);
  const parsed = qrSettingsSchema.safeParse(args.value);
  if (!parsed.success) throw new ConvexError("INVALID_SETTINGS");
  const row = await ctx.db
    .query("ownerSettings")
    .withIndex("by_key", (q) => q.eq("key", "qr"))
    .unique();
  const revision = row?.revision ?? 0;
  if (args.expectedRevision !== revision)
    throw new ConvexError("STALE_SETTINGS");
  const logoStorageId =
    parsed.data.logo === "custom"
      ? (args.storageId ?? row?.logoStorageId)
      : undefined;
  if (parsed.data.logo === "custom" && !logoStorageId)
    throw new ConvexError("MISSING_LOGO");
  if (!(await limiter.limit(ctx, "settings", { key: actor })).ok)
    return { saved: false, revision };
  const updatedAt = Date.now();
  if (row)
    await ctx.db.patch(row._id, {
      value: parsed.data,
      revision: revision + 1,
      updatedAt,
      logoStorageId,
    });
  else
    await ctx.db.insert("ownerSettings", {
      key: "qr",
      value: parsed.data,
      revision: 1,
      updatedAt,
      ...(logoStorageId ? { logoStorageId } : {}),
    });
  if (row?.logoStorageId && row.logoStorageId !== logoStorageId)
    await ctx.storage.delete(row.logoStorageId);
  await ctx.db.insert("adminActivity", {
    actor,
    record: "qr-settings",
    action: args.storageId ? "qr_logo_updated" : "qr_settings_updated",
    timestamp: updatedAt,
  });
  return { saved: true, revision: revision + 1 };
}
export const save = mutation({
  args: { value: qrSettings, expectedRevision: v.number() },
  returns: v.object({ saved: v.boolean(), revision: v.number() }),
  handler: commit,
});
export const saveLogo = internalMutation({
  args: {
    value: qrSettings,
    expectedRevision: v.number(),
    storageId: v.id("_storage"),
  },
  returns: v.object({ saved: v.boolean(), revision: v.number() }),
  handler: commit,
});
export const uploadPermit = internalMutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const actor = await requireOwner(ctx);
    return (await limiter.limit(ctx, "logoUploads", { key: actor })).ok;
  },
});
