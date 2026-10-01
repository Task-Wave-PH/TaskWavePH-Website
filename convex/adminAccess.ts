import { ConvexError } from "convex/values";
import {
  customQuery,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { query, mutation, type QueryCtx } from "./_generated/server";
export async function requireAdmin(ctx: Pick<QueryCtx, "auth" | "db">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("UNAUTHORIZED");
  const admin = await ctx.db
    .query("adminUsers")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();
  if (!admin?.active) throw new ConvexError("FORBIDDEN");
  return identity.subject;
}
const customization = {
  args: {},
  input: async (ctx: QueryCtx) => ({
    ctx: { actor: await requireAdmin(ctx) },
    args: {},
  }),
};
export const adminQuery = customQuery(query, customization);
export const adminMutation = customMutation(mutation, customization);
