import { v } from "convex/values";
export const jobStatus = v.union(
  v.literal("Draft"),
  v.literal("Published"),
  v.literal("Closed"),
  v.literal("Archived"),
);
const richMark = v.object({
  type: v.union(v.literal("bold"), v.literal("italic")),
});
const richInline = v.union(
  v.object({
    type: v.literal("text"),
    text: v.string(),
    marks: v.optional(v.array(richMark)),
  }),
  v.object({
    type: v.literal("hardBreak"),
    marks: v.optional(v.array(richMark)),
  }),
);
const richParagraph = v.object({
  type: v.literal("paragraph"),
  content: v.optional(v.array(richInline)),
});
const richDocument = v.object({
  type: v.literal("doc"),
  content: v.array(
    v.union(
      richParagraph,
      v.object({
        type: v.literal("bulletList"),
        content: v.array(
          v.object({
            type: v.literal("listItem"),
            content: v.array(richParagraph),
          }),
        ),
      }),
    ),
  ),
});
const richText = v.object({
  description: v.optional(richDocument),
  responsibilities: v.optional(richDocument),
  requirements: v.optional(richDocument),
});
export const jobFields = {
  richText: v.optional(richText),
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
  slug: v.optional(v.string()),
  ...jobFields,
  _id: v.id("jobs"),
  status: jobStatus,
  publishedAt: v.optional(v.number()),
  updatedAt: v.number(),
});
