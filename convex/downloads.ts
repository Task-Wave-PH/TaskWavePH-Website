import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";
import { requireAdmin } from "./adminAccess";
import { resumeFile } from "./validators";
export const find = internalQuery({
  args: { id: v.string() },
  returns: v.union(resumeFile, v.null()),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const normalized = ctx.db.normalizeId("applications", id);
    if (!normalized) return null;
    return (await ctx.db.get(normalized))?.resumeFile ?? null;
  },
});
export const audit = internalMutation({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("adminActivity", {
      actor: await requireAdmin(ctx),
      record: args.id,
      action: "resume_downloaded",
      timestamp: Date.now(),
    });
    return null;
  },
});
