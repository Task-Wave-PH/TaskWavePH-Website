import { v } from "convex/values";
export const staffRole = v.union(v.literal("Owner"), v.literal("Staff"));
export const invitationStatus = v.union(
  v.literal("Sending"),
  v.literal("Pending"),
  v.literal("Accepted"),
  v.literal("Revoked"),
  v.literal("Failed"),
);
export const staffView = v.object({
  id: v.id("adminUsers"),
  subject: v.string(),
  active: v.boolean(),
  role: staffRole,
  email: v.string(),
  name: v.string(),
  revision: v.number(),
});
export const invitationView = v.object({
  id: v.id("staffInvitations"),
  email: v.string(),
  role: staffRole,
  status: invitationStatus,
  expiresAt: v.number(),
  createdAt: v.number(),
});
