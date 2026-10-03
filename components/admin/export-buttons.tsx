"use client";
import {
  filterParams,
  type ApplicationFilters,
} from "@/features/applications/campaigns";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronDown, Download, FileText, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { ApplicantView } from "@/features/applications/admin-types";
export function ExportButtons({
  status = "",
  filters = {},
  previewRows,
}: {
  status?: string;
  filters?: ApplicationFilters;
  previewRows?: ApplicantView[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function exportFile(format: "pdf" | "xlsx") {
    setBusy(true);
    setError("");
    const toastId = toast.loading("Preparing export…");
    let failureMessage = "Unable to export. Check your access and try again.";
    const description = previewRows ? "Sample preview data only." : undefined;
    try {
      let blob: Blob;
      if (previewRows) {
        const { createExport } = await import("@/features/applications/export");
        const { loadPreviewExportAssets } =
          await import("@/features/applications/export-assets");
        const assets = await loadPreviewExportAssets(format);
        const bytes = await createExport(previewRows, format, {
          assets,
          filters,
          status,
          preview: true,
        });
        blob = new Blob([new Uint8Array(bytes).buffer]);
      } else {
        const payload = {
          format,
          ...filterParams(filters),
          ...(status ? { status } : {}),
        };
        const response = await fetch("/api/admin/applications/export", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          failureMessage =
            response.status === 413
              ? "Too many records to export. Narrow the filters before exporting."
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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              className="min-h-11 px-4"
              variant="outline"
              disabled={busy}
            />
          }
        >
          <Download />
          {busy ? "Exporting…" : "Export"}
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem
            className="min-h-11"
            disabled={busy}
            onClick={() => exportFile("pdf")}
          >
            <FileText />
            PDF report
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11"
            disabled={busy}
            onClick={() => exportFile("xlsx")}
          >
            <FileSpreadsheet />
            Excel workbook
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
