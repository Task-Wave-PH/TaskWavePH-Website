import type { ApplicantView } from "./admin-types";

// Screening guidance, not an eligibility decision or an interview booking gate.
export function missingScreeningInformation(record: ApplicantView): string[] {
  const d = record.data;
  return [
    !d.availability.trim() && "possible start date / availability",
    !d.expectedSalary?.trim() &&
      "expected salary (currency and pay period, or negotiable)",
    d.experience === undefined && "years of active work experience",
    !d.strengthOne?.trim() && "first key strength",
    !d.strengthTwo?.trim() && "second key strength",
    !record.resumeFile && "a PDF CV (up to 2 MB)",
  ].filter((value): value is string => typeof value === "string");
}

export function screeningRequest(record: ApplicantView): string {
  const missing = missingScreeningInformation(record);
  if (!missing.length) return "";
  return `Thank you for your interest in ${record.data.position} at TaskWavePH. To help us review your application, please provide:\n\n${missing.map((item) => `• ${item}`).join("\n")}\n\nPlease follow the work arrangement stated in the job posting. If travel or relocation is relevant to this role, please also confirm your approximate distance or travel time from Dagupan and whether you are willing to relocate. Portfolio or project links are welcome if available.\n\nOur recruitment team will review your information and contact you if your profile matches an available opportunity.`;
}
