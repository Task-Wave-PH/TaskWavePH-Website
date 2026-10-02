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
export async function createExport(
  records: ApplicantView[],
  format: "csv" | "xlsx",
) {
  if (records.length > MAX_EXPORT_ROWS) throw new Error("EXPORT_TOO_LARGE");
  if (format === "csv") return new TextEncoder().encode(toCsv(records));
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TaskWavePH";
  const sheet = workbook.addWorksheet("Applicants", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = exportColumns.map((header) => ({
    header,
    width: /Message|Notes|Link/.test(header)
      ? 45
      : /Email|Submitted/.test(header)
        ? 30
        : 22,
  }));
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: exportColumns.length },
  };
  sheet.getRow(1).height = 30;
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF071B3B" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  for (const record of records) {
    const row = sheet.addRow(exportValues(record));
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      if (row.number % 2 === 0)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEFF4FF" },
        };
    });
    row.getCell(6).numFmt = "@";
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
