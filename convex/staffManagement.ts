import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { requireAdmin, requireOwner } from "./adminAccess";
import {
  staffRole,
  staffView,
  invitationView,
  invitationStatus,
} from "./staffValidators";
import { RateLimiter, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
const limiter = new RateLimiter(components.rateLimiter, {
  staffInvites: { kind: "fixed window", rate: 20, period: HOUR },
  staffAccepts: { kind: "fixed window", rate: 20, period: HOUR },
});
export const acceptanceThrottle = internalMutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHORIZED");
    return (await limiter.limit(ctx, "staffAccepts", { key: identity.subject }))
      .ok;
  },
});
export const throttle = internalMutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const actor = await requireOwner(ctx);
    return (await limiter.limit(ctx, "staffInvites", { key: actor })).ok;
  },
});

export const current = query({
  args: {},
  returns: v.object({ subject: v.string(), role: staffRole }),
  handler: async (ctx) => {
    const subject = await requireAdmin(ctx);
    const row = await ctx.db
      .query("adminUsers")
      .withIndex("by_subject", (q) => q.eq("subject", subject))
      .unique();
    return { subject, role: row?.role ?? "Staff" };
  },
});
export const owner = internalQuery({
  args: {},
  returns: v.string(),
  handler: async (ctx) => requireOwner(ctx),
});
export const retryContext = internalQuery({
  args: { id: v.id("staffInvitations") },
  returns: v.object({ email: v.string(), role: staffRole, token: v.string() }),
  handler: async (ctx, { id }) => {
    await requireOwner(ctx);
    const row = await ctx.db.get(id);
    if (!row || !["Failed", "Sending"].includes(row.status))
      throw new ConvexError("INVITATION_UNAVAILABLE");
    return { email: row.email, role: row.role, token: row.operationToken };
  },
});
export const acceptanceContext = internalQuery({
  args: { reference: v.string() },
  returns: v.union(
    v.null(),
    v.object({ id: v.id("staffInvitations"), clerkId: v.string() }),
  ),
  handler: async (ctx, { reference }) => {
    if (!(await ctx.auth.getUserIdentity()))
      throw new ConvexError("UNAUTHORIZED");
    const id = ctx.db.normalizeId("staffInvitations", reference);
    const row = id ? await ctx.db.get(id) : null;
    return row &&
      ["Pending", "Accepted"].includes(row.status) &&
      row.clerkInvitationId
      ? { id: row._id, clerkId: row.clerkInvitationId }
      : null;
  },
});
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    active: v.optional(v.boolean()),
  },
  returns: v.object({
    page: v.array(staffView),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, { paginationOpts, active }) => {
    await requireOwner(ctx);
    const result = await (
      active === undefined
        ? ctx.db.query("adminUsers")
        : ctx.db
            .query("adminUsers")
            .withIndex("by_active_role", (q) => q.eq("active", active))
    )
      .order("desc")
      .paginate({
        ...paginationOpts,
        numItems: Math.min(paginationOpts.numItems, 50),
      });
    return {
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      page: result.page.map((row) => ({
        id: row._id,
        subject: row.subject,
        active: row.active,
        role: row.role ?? "Staff",
        email: row.email ?? "",
        name: row.name ?? "",
        revision: row.updatedAt ?? 0,
      })),
    };
  },
});
export const invitations = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(invitationStatus),
  },
  returns: v.object({
    page: v.array(invitationView),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, { paginationOpts, status }) => {
    await requireOwner(ctx);
    const result = await (
      status
        ? ctx.db
            .query("staffInvitations")
            .withIndex("by_status", (q) => q.eq("status", status))
        : ctx.db.query("staffInvitations")
    )
      .order("desc")
      .paginate({
        ...paginationOpts,
        numItems: Math.min(paginationOpts.numItems, 50),
      });
    return {
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      page: result.page.map((row) => ({
        id: row._id,
        email: row.email,
        role: row.role,
        status: row.status,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
      })),
    };
  },
});
export const update = mutation({
  args: {
    id: v.id("adminUsers"),
    active: v.boolean(),
    role: staffRole,
    expectedRevision: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireOwner(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new ConvexError("NOT_FOUND");
    if ((row.updatedAt ?? 0) !== args.expectedRevision)
      throw new ConvexError("EDIT_CONFLICT");
    if (
      row.active &&
      row.role === "Owner" &&
      (!args.active || args.role !== "Owner")
    ) {
      const owners = await ctx.db
        .query("adminUsers")
        .withIndex("by_active_role", (q) =>
          q.eq("active", true).eq("role", "Owner"),
        )
        .take(2);
      if (owners.length < 2) throw new ConvexError("LAST_OWNER");
    }
    await ctx.db.patch(args.id, {
      active: args.active,
      role: args.role,
      updatedAt: Math.max(Date.now(), (row.updatedAt ?? 0) + 1),
    });
    await ctx.db.insert("adminActivity", {
      actor,
      record: row.subject,
      action: args.active ? `staff-role-${args.role}` : "staff-deactivated",
      timestamp: Date.now(),
    });
    return null;
  },
});
export const reserve = internalMutation({
  args: { email: v.string(), role: staffRole, token: v.string() },
  returns: v.object({
    id: v.id("staffInvitations"),
    clerkId: v.optional(v.string()),
    email: v.string(),
    role: staffRole,
    done: v.boolean(),
  }),
  handler: async (ctx, { email, role, token }) => {
    const actor = await requireOwner(ctx);
    email = email.trim().toLowerCase();
    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^[0-9a-f-]{36}$/i.test(token)
    )
      throw new ConvexError("INVALID_INVITATION");
    const existing = await ctx.db
      .query("staffInvitations")
      .withIndex("by_token", (q) => q.eq("operationToken", token))
      .unique();
    if (existing) {
      if (existing.email !== email || existing.role !== role)
        throw new ConvexError("INVALID_INVITATION");
      if (
        existing.status === "Revoked" ||
        existing.status === "Accepted" ||
        existing.expiresAt <= Date.now()
      )
        throw new ConvexError("INVITATION_UNAVAILABLE");
      if (
        existing.status === "Sending" &&
        existing.attemptedAt > Date.now() - 60_000
      )
        throw new ConvexError("INVITATION_IN_PROGRESS");
      if (existing.status !== "Pending")
        await ctx.db.patch(existing._id, {
          status: "Sending",
          attemptedAt: Date.now(),
          createdBy: actor,
        });
      return {
        id: existing._id,
        email,
        role,
        ...(existing.clerkInvitationId
          ? { clerkId: existing.clerkInvitationId }
          : {}),
        done: existing.status === "Pending",
      };
    }
    const staff = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (staff) throw new ConvexError("ACCOUNT_EXISTS");
    for (const status of ["Pending", "Sending"] as const) {
      const pending = await ctx.db
        .query("staffInvitations")
        .withIndex("by_email_status", (q) =>
          q.eq("email", email).eq("status", status),
        )
        .take(2);
      if (pending.some((row) => row.expiresAt > Date.now()))
        throw new ConvexError("INVITATION_EXISTS");
    }
    const id = await ctx.db.insert("staffInvitations", {
      email,
      role,
      status: "Sending",
      createdBy: actor,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 86400_000,
      attemptedAt: Date.now(),
      operationToken: token,
    });
    await ctx.db.insert("adminActivity", {
      actor,
      record: id,
      action: "staff-invitation-created",
      timestamp: Date.now(),
    });
    return { id, email, role, done: false };
  },
});
export const finish = internalMutation({
  args: { id: v.id("staffInvitations"), clerkId: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { id, clerkId }) => {
    await requireOwner(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.status !== "Sending")
      throw new ConvexError("INVITATION_UNAVAILABLE");
    await ctx.db.patch(id, {
      status: clerkId ? "Pending" : "Failed",
      ...(clerkId ? { clerkInvitationId: clerkId } : {}),
    });
    return null;
  },
});
export const cancel = internalMutation({
  args: { id: v.id("staffInvitations") },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, { id }) => {
    const actor = await requireOwner(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.status === "Accepted")
      throw new ConvexError("INVITATION_UNAVAILABLE");
    if (row.status === "Sending" && row.attemptedAt > Date.now() - 60_000)
      throw new ConvexError("INVITATION_IN_PROGRESS");
    await ctx.db.patch(id, { status: "Revoked" });
    await ctx.db.insert("adminActivity", {
      actor,
      record: id,
      action: "staff-invitation-revoked",
      timestamp: Date.now(),
    });
    return row.clerkInvitationId ?? null;
  },
});
export const accept = internalMutation({
  args: {
    id: v.id("staffInvitations"),
    email: v.string(),
    name: v.string(),
    clerkId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { id, email, name, clerkId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHORIZED");
    const existing = await ctx.db
      .query("adminUsers")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .unique();
    // Never reactivate or promote an existing account through an old invitation.
    if (existing) return existing.active;
    const invitation = await ctx.db.get(id);
    if (
      !invitation ||
      invitation.status !== "Pending" ||
      invitation.expiresAt <= Date.now() ||
      invitation.email !== email.trim().toLowerCase() ||
      invitation.clerkInvitationId !== clerkId
    )
      return false;
    const inviter = await ctx.db
      .query("adminUsers")
      .withIndex("by_subject", (q) => q.eq("subject", invitation.createdBy))
      .unique();
    if (!inviter?.active || inviter.role !== "Owner") return false;
    await ctx.db.insert("adminUsers", {
      subject: identity.subject,
      active: true,
      role: invitation.role,
      email: invitation.email,
      name: name.trim().slice(0, 200),
      updatedAt: Date.now(),
    });
    await ctx.db.patch(id, { status: "Accepted" });
    await ctx.db.insert("adminActivity", {
      actor: identity.subject,
      record: id,
      action: "staff-invitation-accepted",
      timestamp: Date.now(),
    });
    return true;
  },
});
