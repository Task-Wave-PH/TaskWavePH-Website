import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { staffRole } from "./staffValidators";
// Invoke from the authenticated Convex CLI/dashboard, never the browser.
export const setStaff = internalMutation({
  args: {
    subject: v.string(),
    active: v.boolean(),
    role: v.optional(staffRole),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { subject, active, role, email, name }) => {
    if (!subject.startsWith("user_") || subject.length > 200)
      throw new Error("Invalid Clerk user ID");
    const existing = await ctx.db
      .query("adminUsers")
      .withIndex("by_subject", (q) => q.eq("subject", subject))
      .unique();
    const nextRole = role ?? existing?.role ?? "Staff";
    if (
      existing?.active &&
      existing.role === "Owner" &&
      (!active || nextRole !== "Owner")
    ) {
      const owners = await ctx.db
        .query("adminUsers")
        .withIndex("by_active_role", (q) =>
          q.eq("active", true).eq("role", "Owner"),
        )
        .take(2);
      if (owners.length < 2) throw new Error("LAST_OWNER");
    }
    const data = {
      active,
      role: nextRole,
      ...(email ? { email: email.trim().toLowerCase() } : {}),
      ...(name ? { name: name.trim().slice(0, 200) } : {}),
      updatedAt: Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1),
    };
    if (existing) await ctx.db.patch(existing._id, data);
    else await ctx.db.insert("adminUsers", { subject, ...data });
    return null;
  },
});
