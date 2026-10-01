import "server-only";
import { z } from "zod";
import { submissionsEnabled } from "./submission-env";

export function getPrivacyInformation() {
  const organization = z
    .string()
    .trim()
    .min(2)
    .safeParse(process.env.PRIVACY_ORGANIZATION);
  const contact = z.email().safeParse(process.env.PRIVACY_CONTACT_EMAIL);
  const retention = z
    .string()
    .trim()
    .min(10)
    .safeParse(process.env.PRIVACY_RETENTION_NOTICE);
  const approved =
    process.env.NODE_ENV === "production" &&
    process.env.PRIVACY_POLICY_APPROVED === "true" &&
    organization.success &&
    contact.success &&
    retention.success;
  return {
    organization: organization.success ? organization.data : "TaskWavePH",
    contact: contact.success ? contact.data : undefined,
    retention: retention.success ? retention.data : undefined,
    status: approved ? "Published privacy policy" : "Development draft",
    notice: approved
      ? "This policy explains how TaskWavePH handles recruitment applications, business enquiries, and website information."
      : submissionsEnabled() && process.env.NODE_ENV === "development"
        ? "Development collection notice. Use test information only. This policy is being finalized before real personal information is collected."
        : "Draft notice. Applications and business enquiries are not open for real-data collection. The company’s privacy details must be finalized before launch.",
  };
}
