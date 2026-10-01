import { z } from "zod";
export const MAX_RESUME_BYTES = 2 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_RESUME_BYTES + 64 * 1024;
export const submissionTokenSchema = z.string().uuid();
export const CONSENT_VERSION = "2026-10-convex-v1";
export const applicationStatuses = [
  "New",
  "Reviewed",
  "Shortlisted",
  "Closed",
] as const;
export const leadStatuses = ["New", "Contacted", "Closed"] as const;
export async function validateResume(file: Blob) {
  if (
    !file.size ||
    file.size > MAX_RESUME_BYTES ||
    file.type !== "application/pdf"
  )
    throw new Error("INVALID_RESUME");
  const signature = new TextDecoder().decode(
    await file.slice(0, 5).arrayBuffer(),
  );
  if (signature !== "%PDF-") throw new Error("INVALID_RESUME");
}
