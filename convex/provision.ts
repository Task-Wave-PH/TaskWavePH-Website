import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
// Invoke from the authenticated Convex CLI/dashboard, never the browser.
export const setStaff = internalMutation({
  args: { subject: v.string(), active: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { subject, active }) => {
    if (!subject.startsWith("user_") || subject.length > 200)
      throw new Error("Invalid Clerk user ID");
    const existing = await ctx.db
      .query("adminUsers")
      .withIndex("by_subject", (q) => q.eq("subject", subject))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { active });
    else await ctx.db.insert("adminUsers", { subject, active });
    return null;
  },
});
