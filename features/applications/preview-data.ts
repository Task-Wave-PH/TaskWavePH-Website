import type { ApplicantView } from "./admin-types";
import { sampleResumeBytes } from "./sample-resume";
export function previewApplicants(): ApplicantView[] {
  return Array.from({ length: 50 }, (_, i) => ({
    _id: `sample-${String(i + 1).padStart(3, "0")}`,
    reference: `TW-PREVIEW-${String(i + 1).padStart(3, "0")}`,
    submittedAt: Date.UTC(2026, 9, 1) - i * 86400000,
    consentVersion: "development-sample",
    status: (["New", "Reviewed", "Shortlisted", "Closed"] as const)[i % 4],
    notes: "Synthetic sample for UI testing.",
    data: {
      ...(i < 3
        ? {
            jobId: "sample-job-001",
            jobTitle: "Sample Customer Support Role 1",
          }
        : {}),
      firstName: "Sample",
      lastName: `Applicant ${i + 1}`,
      email: `sample-${i + 1}@example.invalid`,
      phone: `+6391700000${String(i).padStart(2, "0")}`,
      location: ["Cebu", "Manila", "Davao"][i % 3],
      position: ["Customer Support", "Virtual Assistance", "Web Development"][
        i % 3
      ],
      ...(i % 3 ? { experience: i % 8 } : {}),
      employmentStatus: i % 2 ? "Employed" : "",
      availability: i % 2 ? "Within two weeks" : "",
      resume: "",
      message:
        i === 1
          ? "Sample note. ".repeat(120)
          : "Synthetic applicant. No real personal information.",
      privacyConsent: true,
      source: "development-preview",
      campaign: "sample-campaign",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      landing_page: "/apply",
    },
    ...(i < 5
      ? {
          resumeFile: {
            name: "sample-cv.pdf",
            size: sampleResumeBytes().length,
          },
        }
      : {}),
  }));
}
