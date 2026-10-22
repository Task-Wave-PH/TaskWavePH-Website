import { jobBodyFields, jobRichTextSchema, richTextPlain } from "./rich-text";
import { z } from "zod";
export const serviceAreas = [
  "Customer Support",
  "Digital Marketing",
  "Web Development",
  "Virtual Assistance",
  "Admin & Business Support",
  "Lead Generation & Sales Support",
] as const;
export const workArrangements = ["Remote", "Hybrid", "On-site"] as const;
export const employmentTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Project-based",
] as const;
export const jobStatuses = [
  "Draft",
  "Published",
  "Closed",
  "Archived",
] as const;
export const jobSchema = z
  .object({
    richText: jobRichTextSchema.optional(),
    title: z.string().trim().min(2).max(200),
    serviceArea: z.enum(serviceAreas),
    location: z.string().trim().min(1).max(200),
    arrangement: z.enum(workArrangements),
    employmentType: z.enum(employmentTypes),
    description: z.string().trim().min(20).max(10000),
    responsibilities: z.string().trim().min(10).max(10000),
    requirements: z.string().trim().min(10).max(10000),
    salary: z.string().trim().max(200),
  })
  .superRefine((data, ctx) => {
    for (const field of jobBodyFields) {
      const doc = data.richText?.[field];
      if (!doc) continue;
      const text = richTextPlain(doc).trim();
      const min = field === "description" ? 20 : 10;
      if (text.length < min || text.length > 10000)
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `Enter ${min}–10,000 characters of content.`,
        });
    }
  })
  .transform((data) => {
    for (const field of jobBodyFields) {
      const doc = data.richText?.[field];
      if (doc) data[field] = richTextPlain(doc).trim();
    }
    return data;
  });
export type JobInput = z.infer<typeof jobSchema>;
export type JobStatus = (typeof jobStatuses)[number];
export type JobView = JobInput & {
  _id: string;
  slug?: string;
  status: JobStatus;
  publishedAt?: number;
  updatedAt: number;
};
