"use client";
import { ApplicationFilterControls } from "./application-filters";
import {
  applicationMatches,
  type ApplicationFilters,
} from "@/features/applications/campaigns";
import { usePreviewJobs } from "@/components/jobs/preview-provider";
import { useState } from "react";
import { usePreviewApplicants } from "./preview-provider";
import { ExportButtons } from "./export-buttons";
import { RecordsView } from "./records-view";
export function PreviewApplicantsList() {
  const { jobs } = usePreviewJobs();
  const { records } = usePreviewApplicants();
  const [filters, setFilters] = useState<ApplicationFilters>({});
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(20);
  const filtered = records.filter(
    (row) =>
      (!status || row.status === status) && applicationMatches(row, filters),
  );
  return (
    <>
      <RecordsView
        filters={
          <ApplicationFilterControls
            jobs={jobs}
            sources={[
              ...new Set(records.map((row) => row.data.source).filter(Boolean)),
            ]}
            campaigns={[
              ...new Set(
                records.map((row) => row.data.campaign).filter(Boolean),
              ),
            ]}
            status={status}
            onChange={(value, nextStatus) => {
              setFilters(value);
              setStatus(nextStatus);
              setLimit(20);
            }}
            actions={
              <ExportButtons
                status={status}
                filters={filters}
                previewRows={filtered}
              />
            }
          />
        }
        kind="applications"
        rows={filtered.slice(0, limit).map((row) => ({
          id: row._id,
          reference: row.reference,
          name: `${row.data.firstName} ${row.data.lastName}`,
          email: row.data.email,
          status: row.status,
          submittedAt: row.submittedAt,
          source: row.data.source,
          campaign: row.data.campaign,
          jobTitle: row.data.position,
        }))}
        status={status}
        onStatus={(value) => {
          setStatus(value);
          setLimit(20);
        }}
        preview
        matchedCount={filtered.length}
        more={
          filtered.length > limit ? () => setLimit((v) => v + 20) : undefined
        }
      />
    </>
  );
}
