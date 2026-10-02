"use client";
import { toast } from "sonner";
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
    const toastId = toast.loading("Preparing export…");
    let failureMessage = "Unable to export. Check your access and try again.";
    const description = previewRows ? "Sample preview data only." : undefined;
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
        if (!response.ok) {
          failureMessage =
            response.status === 413
              ? "More than 5,000 records match. Narrow the status filter before exporting."
              : response.status === 429
                ? "Export limit reached. Please wait a few minutes before trying again."
                : failureMessage;
          throw new Error(failureMessage);
        }
        blob = await response.blob();
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taskwaveph-${previewRows ? "sample-" : ""}applicants.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Export download started.", {
        id: toastId,
        description,
        duration: 5000,
      });
    } catch {
      setError(failureMessage);
      toast.error(failureMessage, { id: toastId, description, duration: 8000 });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          className="min-h-11 px-4"
          variant="outline"
          disabled={busy}
          onClick={() => exportFile("csv")}
        >
          Export CSV
        </Button>
        <Button
          className="min-h-11 px-4"
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
