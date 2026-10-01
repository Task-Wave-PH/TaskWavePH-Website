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
export default defineSchema({
  applications: defineTable({
    data: applicationData,
    ...baseFields,
    status: applicationStatus,
    resumeFile: v.optional(resumeFile),
  })
    .index("by_submissionToken", ["submissionToken"])
    .index("by_status", ["status"])
    .index("by_resumeStorage", ["resumeFile.storageId"]),
  businessLeads: defineTable({
    data: leadData,
    ...baseFields,
    status: leadStatus,
  })
    .index("by_submissionToken", ["submissionToken"])
    .index("by_status", ["status"]),
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
