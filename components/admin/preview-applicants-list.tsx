"use client";
import { useState } from "react";
import { usePreviewApplicants } from "./preview-provider";
import { ExportButtons } from "./export-buttons";
import { RecordsView } from "./records-view";
export function PreviewApplicantsList() {
  const { records } = usePreviewApplicants();
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(20);
  const filtered = records.filter((row) => !status || row.status === status);
  return (
    <RecordsView
      kind="applications"
      rows={filtered.slice(0, limit).map((row) => ({
        id: row._id,
        reference: row.reference,
        name: `${row.data.firstName} ${row.data.lastName}`,
        email: row.data.email,
        status: row.status,
        submittedAt: row.submittedAt,
      }))}
      status={status}
      onStatus={(value) => {
        setStatus(value);
        setLimit(20);
      }}
      preview
      matchedCount={filtered.length}
      actions={<ExportButtons previewRows={filtered} />}
      more={filtered.length > limit ? () => setLimit((v) => v + 20) : undefined}
    />
  );
}
