"use client";
import { adminOperation } from "@/features/admin/operation-feedback";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PreviewApplicantsList } from "./preview-applicants-list";
import { usePreviewLeads } from "./preview-provider";
import { RecordsView } from "./records-view";
import { LeadDetails } from "./lead-details";
export function PreviewDashboardContent({
  kind,
}: {
  kind: "applications" | "businessLeads";
}) {
  return kind === "applications" ? (
    <PreviewApplicantsList />
  ) : (
    <PreviewLeadsList />
  );
}
function PreviewLeadsList() {
  const { leads, prioritizeLead } = usePreviewLeads();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState(false);
  const [limit, setLimit] = useState(20);
  const filtered = leads.filter(
    (row) => (!status || row.status === status) && (!priority || row.priority),
  );
  return (
    <RecordsView
      kind="businessLeads"
      rows={filtered.slice(0, limit).map((row) => ({
        id: row._id,
        reference: row.reference,
        name: row.data.company,
        email: row.data.email,
        status: row.status,
        submittedAt: row.submittedAt,
        priority: row.priority,
      }))}
      preview
      matchedCount={filtered.length}
      status={status}
      onStatus={(value) => {
        setStatus(value);
        setLimit(20);
      }}
      priorityOnly={priority}
      onPriorityFilter={(value) => {
        setPriority(value);
        setLimit(20);
      }}
      onPriority={(row) => {
        void adminOperation(async () => prioritizeLead(row.id, !row.priority), {
          loading: "Updating priority…",
          success: row.priority
            ? "Priority removed."
            : "Lead marked as priority.",
          error: "Unable to change sample priority.",
          preview: true,
        }).catch(() => {});
      }}
      more={filtered.length > limit ? () => setLimit((v) => v + 20) : undefined}
    />
  );
}
export function PreviewLeadDetails({ id }: { id: string }) {
  const { leads, updateLead, prioritizeLead, removeLead } = usePreviewLeads();
  const router = useRouter();
  const lead = leads.find((row) => row._id === id);
  if (!lead)
    return (
      <p role="status">Lead not found. Preview records reset on refresh.</p>
    );
  return (
    <LeadDetails
      key={id}
      record={lead}
      backHref="/dev-preview/businessLeads"
      onSave={async (status, notes, _expected, nextFollowUp) =>
        updateLead(id, status, notes, nextFollowUp)
      }
      onPriority={async (value) => prioritizeLead(id, value)}
      onDelete={async () => {
        removeLead(id);
        router.push("/dev-preview/businessLeads");
      }}
    />
  );
}
