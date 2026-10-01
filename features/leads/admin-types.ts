import type { Infer } from "convex/values";
import type { leadData } from "@/convex/validators";
export type LeadView = {
  _id: string;
  reference: string;
  submittedAt: number;
  status: "New" | "Contacted" | "Closed";
  notes: string;
  priority?: boolean;
  data: Infer<typeof leadData>;
};
export function previewLeads(): LeadView[] {
  return Array.from({ length: 60 }, (_, index) => ({
    _id: `sample-lead-${String(index + 1).padStart(3, "0")}`,
    reference: `TW-LEAD-PREVIEW-${index + 1}`,
    submittedAt: Date.UTC(2026, 9, 1) - (index % 45) * 86400000,
    status: (["New", "Contacted", "Closed"] as const)[index % 3],
    notes: "Synthetic business enquiry for UI preview.",
    priority: index % 7 === 0,
    data: {
      company: `Sample business ${index + 1}`,
      contactName: `Sample contact ${index + 1}`,
      email: `business-${index + 1}@example.invalid`,
      phone: "+639170000000",
      companyWebsite: "",
      services: [index % 2 ? "Virtual Assistance" : "Customer Support"],
      message:
        "Sample business enquiry. No real company or personal information.",
      privacyConsent: true,
      source: "development-preview",
      campaign: "sample-campaign",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      landing_page: "/business-enquiry",
    },
  }));
}
