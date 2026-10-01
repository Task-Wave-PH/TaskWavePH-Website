import { v } from "convex/values";
import { query } from "./_generated/server";
export const current = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    return !!(
      await ctx.db
        .query("adminUsers")
        .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
        .unique()
    )?.active;
  },
});
