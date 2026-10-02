import { v } from "convex/values";
export const trackingFields = {
  source: v.string(),
  campaign: v.string(),
  utm_source: v.string(),
  utm_medium: v.string(),
  utm_campaign: v.string(),
  landing_page: v.string(),
};
export const applicationData = v.object({
  jobId: v.optional(v.string()),
  jobTitle: v.optional(v.string()),
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(),
  phone: v.string(),
  location: v.string(),
  position: v.string(),
  experience: v.optional(v.number()),
  employmentStatus: v.string(),
  availability: v.string(),
  expectedSalary: v.optional(v.string()),
  previousSalary: v.optional(v.string()),
  strengthOne: v.optional(v.string()),
  strengthTwo: v.optional(v.string()),
  distanceFromDagupan: v.optional(v.string()),
  relocationPreference: v.optional(
    v.union(
      v.literal(""),
      v.literal("Willing"),
      v.literal("Not willing"),
      v.literal("Discuss first"),
    ),
  ),
  portfolio: v.optional(v.string()),
  resume: v.string(),
  message: v.string(),
  referredBy: v.optional(v.string()),
  privacyConsent: v.boolean(),
  ...trackingFields,
});
export const leadData = v.object({
  company: v.string(),
  contactName: v.string(),
  email: v.string(),
  phone: v.string(),
  companyWebsite: v.string(),
  services: v.array(v.string()),
  message: v.string(),
  privacyConsent: v.boolean(),
  ...trackingFields,
});
export const applicationStatus = v.union(
  v.literal("New"),
  v.literal("Reviewed"),
  v.literal("Shortlisted"),
  v.literal("Closed"),
);
export const leadStatus = v.union(
  v.literal("New"),
  v.literal("Contacted"),
  v.literal("Closed"),
);
export const kindValidator = v.union(
  v.literal("applications"),
  v.literal("businessLeads"),
);
export const resumeFile = v.object({
  storageId: v.id("_storage"),
  name: v.string(),
  size: v.number(),
  contentType: v.literal("application/pdf"),
});
export const baseFields = {
  reference: v.string(),
  submissionToken: v.string(),
  fingerprint: v.string(),
  submittedAt: v.number(),
  consentVersion: v.string(),
  notes: v.string(),
};
