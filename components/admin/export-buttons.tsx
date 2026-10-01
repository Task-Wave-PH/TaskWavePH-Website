"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApplicantView } from "@/features/applications/admin-types";
export function ExportButtons({
  status = "",
  previewRows,
}: {
  status?: string;
  previewRows?: ApplicantView[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function exportFile(format: "csv" | "xlsx") {
    setBusy(true);
    setError("");
    try {
      let blob: Blob;
      if (previewRows) {
        const { createExport } = await import("@/features/applications/export");
        const bytes = await createExport(previewRows, format);
        blob = new Blob([new Uint8Array(bytes).buffer]);
      } else {
        const params = new URLSearchParams({
          format,
          ...(status ? { status } : {}),
        });
        const response = await fetch(
          `/api/admin/applications/export?${params}`,
          { cache: "no-store" },
        );
        if (!response.ok)
          throw new Error(
            response.status === 413
              ? "More than 5,000 records match. Narrow the status filter before exporting."
              : "Unable to export. Check your access and try again.",
          );
        blob = await response.blob();
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taskwaveph-${previewRows ? "sample-" : ""}applicants.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to export.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => exportFile("csv")}
        >
          Export CSV
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => exportFile("xlsx")}
        >
          Export Excel
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
