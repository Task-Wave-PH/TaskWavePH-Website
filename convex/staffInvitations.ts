import { ConvexError, v } from "convex/values";
import { z } from "zod";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { staffRole } from "./staffValidators";
import type { Id } from "./_generated/dataModel";

const remoteInvitation = z.object({
  id: z.string(),
  email_address: z.string(),
  status: z.string(),
  public_metadata: z.record(z.string(), z.unknown()).default({}),
});
async function clerkRequest(
  path: string,
  method = "GET",
  body?: object,
): Promise<unknown> {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) throw new ConvexError("CLERK_NOT_CONFIGURED");
  try {
    const response = await fetch(`https://api.clerk.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error("Clerk request failed");
    return await response.json();
  } catch {
    // Do not expose remote errors, addresses, credentials, or invitation tokens.
    throw new ConvexError("CLERK_UNAVAILABLE");
  }
}
async function findInvitation(reference: string) {
  // Bounded reconciliation after uncertain remote writes. Never send again if
  // the scan cannot prove there is no matching pending invitation.
  for (let offset = 0; offset < 1000; offset += 100) {
    const raw = await clerkRequest(
      `/invitations?status=pending&limit=100&offset=${offset}`,
    );
    const rows = z.array(remoteInvitation).parse(raw);
    const row = rows.find(
      (row) => row.public_metadata.taskwaveStaffInvitation === reference,
    );
    if (row) return row;
    if (rows.length < 100) return null;
  }
  throw new ConvexError("RECONCILIATION_REQUIRED");
}
export const invite = action({
  args: { email: v.string(), role: staffRole, token: v.string() },
  returns: v.id("staffInvitations"),
  handler: async (ctx, args): Promise<Id<"staffInvitations">> => {
    await ctx.runQuery(internal.staffManagement.owner, {});
    if (!(await ctx.runMutation(internal.staffManagement.throttle, {})))
      throw new ConvexError("RATE_LIMITED");
    const redirect = process.env.STAFF_INVITATION_REDIRECT_URL;
    if (!redirect) throw new ConvexError("INVITATIONS_NOT_CONFIGURED");
    const url = new URL(redirect);
    if (
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)
        )) ||
      !["/sign-up", "/admin/sign-up"].includes(url.pathname) ||
      url.search ||
      url.hash
    )
      throw new ConvexError("INVITATIONS_NOT_CONFIGURED");
    const reservation = await ctx.runMutation(
      internal.staffManagement.reserve,
      args,
    );
    if (reservation.done) return reservation.id;
    try {
      const remote =
        (await findInvitation(reservation.id)) ??
        remoteInvitation.parse(
          await clerkRequest("/invitations", "POST", {
            email_address: reservation.email,
            redirect_url: redirect,
            expires_in_days: 7,
            ignore_existing: false,
            notify: true,
            public_metadata: { taskwaveStaffInvitation: reservation.id },
          }),
        );
      if (
        remote.email_address.toLowerCase() !== reservation.email ||
        remote.status !== "pending"
      )
        throw new ConvexError("INVITATION_UNAVAILABLE");
      await ctx.runMutation(internal.staffManagement.finish, {
        id: reservation.id,
        clerkId: remote.id,
      });
      return reservation.id;
    } catch (error) {
      try {
        await ctx.runMutation(internal.staffManagement.finish, {
          id: reservation.id,
        });
      } catch {
        /* A concurrent revocation stays revoked. */
      }
      if (error instanceof ConvexError) throw error;
      throw new ConvexError("CLERK_UNAVAILABLE");
    }
  },
});
export const revoke = action({
  args: { id: v.id("staffInvitations") },
  returns: v.null(),
  handler: async (ctx, { id }): Promise<null> => {
    // Revoke local eligibility first, even if Clerk is unavailable.
    const clerkId = await ctx.runMutation(internal.staffManagement.cancel, {
      id,
    });
    const remoteId = clerkId ?? (await findInvitation(id))?.id;
    if (remoteId)
      await clerkRequest(
        `/invitations/${encodeURIComponent(remoteId)}/revoke`,
        "POST",
      );
    return null;
  },
});
export const retry = action({
  args: { id: v.id("staffInvitations") },
  returns: v.id("staffInvitations"),
  handler: async (ctx, { id }): Promise<Id<"staffInvitations">> => {
    const args = await ctx.runQuery(internal.staffManagement.retryContext, {
      id,
    });
    return ctx.runAction(api.staffInvitations.invite, args);
  },
});
export const accept = action({
  args: {},
  returns: v.boolean(),
  handler: async (ctx): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHORIZED");
    if (
      !(await ctx.runMutation(internal.staffManagement.acceptanceThrottle, {}))
    )
      throw new ConvexError("RATE_LIMITED");
    const user = z
      .object({
        id: z.string(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        primary_email_address_id: z.string().nullable(),
        email_addresses: z.array(
          z.object({
            id: z.string(),
            email_address: z.string(),
            verification: z.object({ status: z.string() }).nullable(),
          }),
        ),
        public_metadata: z.record(z.string(), z.unknown()),
      })
      .parse(
        await clerkRequest(`/users/${encodeURIComponent(identity.subject)}`),
      );
    if (user.id !== identity.subject) return false;
    const email = user.email_addresses.find(
      (row) =>
        row.id === user.primary_email_address_id &&
        row.verification?.status === "verified",
    );
    const reference = user.public_metadata.taskwaveStaffInvitation;
    if (!email || typeof reference !== "string") return false;
    const context = await ctx.runQuery(
      internal.staffManagement.acceptanceContext,
      { reference },
    );
    if (!context) return false;
    return ctx.runMutation(internal.staffManagement.accept, {
      id: context.id,
      clerkId: context.clerkId,
      email: email.email_address,
      name: [user.first_name, user.last_name].filter(Boolean).join(" "),
    });
  },
});
