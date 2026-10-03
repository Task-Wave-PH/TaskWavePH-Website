import type { ExportAssets } from "./export-assets";
import type { ApplicationFilters } from "./campaigns";
import { formatAdminDate } from "../admin/metrics";
import type { ApplicantView } from "./admin-types";
export const MAX_EXPORT_ROWS = 5000;
export const exportColumns = [
  "Application ID",
  "Submitted At (UTC)",
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Location",
  "Position",
  "Years of Experience",
  "Employment Status",
  "Availability",
  "Resume Link",
  "CV Filename",
  "CV Size (bytes)",
  "Message",
  "Privacy Consent",
  "Consent Version",
  "Source",
  "Campaign",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "Landing Page",
  "Status",
  "Internal Notes",
  "Job ID",
  "Job Title at Application",
  "Expected Salary",
  "Previous Salary",
  "First Key Strength",
  "Second Key Strength",
  "Distance / Travel Time from Dagupan",
  "Relocation Preference",
  "Portfolio / Project Link",
  "Referred By",
];
export function exportValues(record: ApplicantView): (string | number)[] {
  const d = record.data;
  return [
    record.reference,
    new Date(record.submittedAt).toISOString(),
    d.firstName,
    d.lastName,
    d.email,
    d.phone,
    d.location,
    d.position,
    d.experience ?? "",
    d.employmentStatus,
    d.availability,
    d.resume,
    record.resumeFile?.name ?? "",
    record.resumeFile?.size ?? "",
    d.message,
    d.privacyConsent ? "Yes" : "No",
    record.consentVersion,
    d.source,
    d.campaign,
    d.utm_source,
    d.utm_medium,
    d.utm_campaign,
    d.landing_page,
    record.status,
    record.notes,
    d.jobId ?? "",
    d.jobTitle ?? "",
    d.expectedSalary ?? "",
    d.previousSalary ?? "",
    d.strengthOne ?? "",
    d.strengthTwo ?? "",
    d.distanceFromDagupan ?? "",
    d.relocationPreference ?? "",
    d.portfolio ?? "",
    d.referredBy ?? "",
  ];
}
function csvCell(value: string | number) {
  let text = String(value);
  if (/^[\s\uFEFF]*[=+\-@]/u.test(text) || /^[\t\r\n]/.test(text))
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function toCsv(records: ApplicantView[]) {
  return (
    "\uFEFF" +
    [exportColumns, ...records.map(exportValues)]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n") +
    "\r\n"
  );
}
export type ExportOptions = {
  assets?: ExportAssets;
  filters?: ApplicationFilters;
  status?: string;
  preview?: boolean;
  generatedAt?: number;
};
export const EXPORT_HEADER_ROW = 6;
export function exportFilterSummary(options: ExportOptions) {
  const filters = options.filters ?? {};
  const details = [
    options.status ? `Status: ${options.status}` : "All statuses",
    ...Object.entries(filters)
      .filter(([, value]) => !!value)
      .map(
        ([key, value]) =>
          `${({ search: "Search", source: "Source", campaign: "Campaign", jobId: "Job ID", from: "From", to: "To" } as Record<string, string>)[key]}: ${value}`,
      ),
  ];
  return details.join(" | ");
}
export async function createExport(
  records: ApplicantView[],
  format: "csv" | "xlsx" | "pdf",
  options: ExportOptions = {},
) {
  if (records.length > MAX_EXPORT_ROWS) throw new Error("EXPORT_TOO_LARGE");
  if (format === "csv") return new TextEncoder().encode(toCsv(records));
  if (!options.assets?.logoDataUrl) throw new Error("BRAND_ASSET_UNAVAILABLE");
  if (format === "pdf") {
    const { createApplicantPdf } = await import("./export-pdf");
    return createApplicantPdf(records, options);
  }
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TaskWavePH";
  workbook.created = new Date(options.generatedAt ?? Date.now());
  const sheet = workbook.addWorksheet("Applicants", {
    views: [{ state: "frozen", ySplit: EXPORT_HEADER_ROW }],
  });
  sheet.columns = exportColumns.map((header) => ({
    width: /Message|Notes|Link/.test(header)
      ? 45
      : /Email|Submitted/.test(header)
        ? 30
        : 22,
  }));
  const logo = workbook.addImage({
    base64: options.assets.logoDataUrl,
    extension: "png",
  });
  sheet.addImage(logo, {
    tl: { col: 0.15, row: 0.15 },
    ext: { width: 90, height: 90 },
  });
  for (let i = 1; i <= 4; i++) {
    sheet.mergeCells(i, 2, i, 8);
    sheet.getRow(i).height = i === 4 ? 36 : 24;
  }
  sheet.getCell("B1").value = "TaskWavePH";
  sheet.getCell("B1").font = {
    name: "Poppins",
    size: 20,
    bold: true,
    color: { argb: "FF0A1D3B" },
  };
  sheet.getCell("B2").value = "Outsource. Optimize. Grow.";
  sheet.getCell("B2").font = {
    name: "Poppins",
    size: 11,
    color: { argb: "FF0D6EFD" },
  };
  sheet.getCell("B3").value =
    `${options.preview ? "Sample " : ""}Applicant Report · ${records.length} applications · ${formatAdminDate(options.generatedAt ?? Date.now())}`;
  sheet.getCell("B4").value = exportFilterSummary(options);
  sheet.getRow(4).height = Math.max(
    36,
    Math.ceil(exportFilterSummary(options).length / 140) * 15,
  );
  sheet.getCell("B4").alignment = { wrapText: true, vertical: "top" };
  for (const ref of ["B3", "B4"])
    sheet.getCell(ref).font = {
      name: "Poppins",
      size: 10,
      color: { argb: "FF111827" },
    };
  const header = sheet.getRow(EXPORT_HEADER_ROW);
  header.values = exportColumns;
  header.height = 34;
  sheet.autoFilter = {
    from: { row: EXPORT_HEADER_ROW, column: 1 },
    to: { row: EXPORT_HEADER_ROW, column: exportColumns.length },
  };
  header.eachCell((cell) => {
    cell.font = { name: "Poppins", bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0A1D3B" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  for (const record of records) {
    const row = sheet.addRow(exportValues(record));
    row.eachCell((cell) => {
      cell.font = { name: "Poppins", size: 10, color: { argb: "FF111827" } };
      cell.alignment = { vertical: "top", wrapText: true };
      if (row.number % 2 === 0)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF2F4F7" },
        };
    });
    row.getCell(6).numFmt = "@";
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
