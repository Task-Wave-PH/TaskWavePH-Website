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
import { staffRole, invitationStatus } from "./staffValidators";
import { qrSettings } from "./settingsValidators";
export default defineSchema({
  ownerSettings: defineTable({
    key: v.literal("qr"),
    logoStorageId: v.optional(v.id("_storage")),
    value: qrSettings,
    revision: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
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
    searchText: v.optional(v.string()),
  })
    .index("by_submissionToken", ["submissionToken"])
    .index("by_email", ["data.email"])
    .index("by_status", ["status"])
    .index("by_jobId", ["data.jobId"])
    .index("by_resumeStorage", ["resumeFile.storageId"])
    .index("by_campaign_submittedAt", ["data.campaign", "submittedAt"])
    .index("by_source_submittedAt", ["data.source", "submittedAt"])
    .index("by_jobId_submittedAt", ["data.jobId", "submittedAt"])
    .index("by_status_submittedAt", ["status", "submittedAt"])
    .index("by_submittedAt", ["submittedAt"])
    .searchIndex("search_applicants", {
      searchField: "searchText",
      filterFields: ["status", "data.source", "data.campaign", "data.jobId"],
    }),
  businessLeads: defineTable({
    data: leadData,
    ...baseFields,
    status: leadStatus,
    priority: v.optional(v.boolean()),
    nextFollowUp: v.optional(v.string()),
  })
    .index("by_submissionToken", ["submissionToken"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_priority_status", ["priority", "status"]),
  dashboardState: defineTable({
    key: v.literal("overview-v1"),
    ready: v.boolean(),
  }).index("by_key", ["key"]),
  adminUsers: defineTable({
    subject: v.string(),
    active: v.boolean(),
    role: v.optional(staffRole),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_subject", ["subject"])
    .index("by_active_role", ["active", "role"])
    .index("by_email", ["email"]),
  staffInvitations: defineTable({
    email: v.string(),
    role: staffRole,
    status: invitationStatus,
    createdBy: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    operationToken: v.string(),
    clerkInvitationId: v.optional(v.string()),
    attemptedAt: v.number(),
  })
    .index("by_token", ["operationToken"])
    .index("by_email_status", ["email", "status"])
    .index("by_status", ["status"]),
  adminActivity: defineTable({
    actor: v.string(),
    record: v.string(),
    action: v.string(),
    timestamp: v.number(),
  })
    .index("by_record", ["record"])
    .index("by_timestamp", ["timestamp"]),
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
