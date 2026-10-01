import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  applicationData,
  leadData,
  applicationStatus,
  leadStatus,
  resumeFile,
  baseFields,
} from "./validators";
import { jobFields, jobStatus } from "./jobValidators";
export default defineSchema({
  jobs: defineTable({
    ...jobFields,
    status: jobStatus,
    publishedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_status_published", ["status", "publishedAt"])
    .index("by_status_service_published", [
      "status",
      "serviceArea",
      "publishedAt",
    ])
    .index("by_status_arrangement_published", [
      "status",
      "arrangement",
      "publishedAt",
    ])
    .index("by_status_service_arrangement_published", [
      "status",
      "serviceArea",
      "arrangement",
      "publishedAt",
    ]),
  applications: defineTable({
    data: applicationData,
    ...baseFields,
    status: applicationStatus,
    resumeFile: v.optional(resumeFile),
  })
    .index("by_submissionToken", ["submissionToken"])
    .index("by_status", ["status"])
    .index("by_jobId", ["data.jobId"])
    .index("by_resumeStorage", ["resumeFile.storageId"]),
  businessLeads: defineTable({
    data: leadData,
    ...baseFields,
    status: leadStatus,
    priority: v.optional(v.boolean()),
  })
    .index("by_submissionToken", ["submissionToken"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_priority_status", ["priority", "status"]),
  dashboardState: defineTable({
    key: v.literal("overview-v1"),
    ready: v.boolean(),
  }).index("by_key", ["key"]),
  adminUsers: defineTable({ subject: v.string(), active: v.boolean() }).index(
    "by_subject",
    ["subject"],
  ),
  adminActivity: defineTable({
    actor: v.string(),
    record: v.string(),
    action: v.string(),
    timestamp: v.number(),
  }).index("by_record", ["record"]),
  pendingUploads: defineTable({
    submissionToken: v.string(),
    fingerprint: v.string(),
    expiresAt: v.number(),
    storageId: v.optional(v.id("_storage")),
  })
    .index("by_submissionToken", ["submissionToken"])
    .index("by_expiresAt", ["expiresAt"])
    .index("by_storageId", ["storageId"]),
});
