import { v } from "convex/values";
export const jobStatus = v.union(
  v.literal("Draft"),
  v.literal("Published"),
  v.literal("Closed"),
);
export const jobFields = {
  title: v.string(),
  serviceArea: v.union(
    v.literal("Customer Support"),
    v.literal("Digital Marketing"),
    v.literal("Web Development"),
    v.literal("Virtual Assistance"),
    v.literal("Admin & Business Support"),
    v.literal("Lead Generation & Sales Support"),
  ),
  location: v.string(),
  arrangement: v.union(
    v.literal("Remote"),
    v.literal("Hybrid"),
    v.literal("On-site"),
  ),
  employmentType: v.union(
    v.literal("Full-time"),
    v.literal("Part-time"),
    v.literal("Contract"),
    v.literal("Project-based"),
  ),
  description: v.string(),
  responsibilities: v.string(),
  requirements: v.string(),
  salary: v.string(),
};
export const jobInput = v.object(jobFields);
export const jobView = v.object({
  ...jobFields,
  _id: v.id("jobs"),
  status: jobStatus,
  publishedAt: v.optional(v.number()),
  updatedAt: v.number(),
});
