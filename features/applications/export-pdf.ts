import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { ApplicantView } from "./admin-types";
import { exportFilterSummary, type ExportOptions } from "./export";
import { formatAdminDate } from "../admin/metrics";
export function createApplicantPdf(
  records: ApplicantView[],
  options: ExportOptions,
) {
  const assets = options.assets;
  if (!assets?.regularFont || !assets.boldFont)
    throw new Error("BRAND_ASSET_UNAVAILABLE");
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  });
  doc.addFileToVFS("Poppins-Regular.ttf", assets.regularFont);
  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
  doc.addFileToVFS("Poppins-SemiBold.ttf", assets.boldFont);
  doc.addFont("Poppins-SemiBold.ttf", "Poppins", "bold");
  doc.setProperties({
    title: "TaskWavePH Applicant Report",
    author: "TaskWavePH",
    subject: "Confidential recruitment report",
  });
  const width = doc.internal.pageSize.getWidth(),
    height = doc.internal.pageSize.getHeight();
  doc.setFont("Poppins", "normal");
  doc.setFontSize(8);
  const summary = doc.splitTextToSize(
    exportFilterSummary(options),
    width - 24,
  ) as string[];
  // Fixed table widths and wrapping preserve long names, emails, and campaign codes.
  const top = 36 + summary.length * 4;
  autoTable(doc, {
    startY: top,
    margin: { top, bottom: 16, left: 12, right: 12 },
    head: [
      [
        "Submitted / ID",
        "Applicant",
        "Contact",
        "Role / location",
        "Status",
        "Source / campaign",
      ],
    ],
    body: records.map((row) => [
      `${formatAdminDate(row.submittedAt)}\n${row.reference}`,
      `${row.data.firstName} ${row.data.lastName}`,
      `${row.data.email}\n${row.data.phone}`,
      `${row.data.jobTitle || row.data.position}\n${row.data.location}`,
      row.status,
      `${row.data.source || "Unattributed"}\n${row.data.campaign || "No campaign"}`,
    ]),
    theme: "striped",
    styles: {
      font: "Poppins",
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      textColor: [17, 24, 39],
      valign: "top",
    },
    headStyles: {
      fillColor: [10, 29, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [242, 244, 247] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: 53 },
      3: { cellWidth: 58 },
      4: { cellWidth: 27 },
      5: { cellWidth: 55 },
    },
    rowPageBreak: "avoid",
    willDrawPage: () => {
      doc.addImage(assets.logoDataUrl, "PNG", 12, 5, 23, 23);
      doc.setFont("Poppins", "bold");
      doc.setFontSize(18);
      doc.setTextColor(10, 29, 59);
      doc.text("TaskWavePH", 39, 14);
      doc.setFont("Poppins", "normal");
      doc.setFontSize(9);
      doc.setTextColor(13, 110, 253);
      doc.text("Outsource. Optimize. Grow.", 39, 20);
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(9);
      doc.text(
        `${options.preview ? "Sample " : ""}Applicant Report | ${records.length} applications | ${formatAdminDate(options.generatedAt ?? Date.now())}`,
        12,
        30,
      );
      doc.setFontSize(8);
      doc.text(summary, 12, 35);
    },
  });
  if (!records.length) {
    doc.setFont("Poppins", "normal");
    doc.setFontSize(10);
    doc.text("No applications match the selected filters.", 12, top + 18);
  }
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setFont("Poppins", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 110, 125);
    doc.text(
      "Confidential - recruitment use only. Excel includes the full applicant fields.",
      12,
      height - 7,
    );
    doc.text(
      `Page ${page} of ${doc.getNumberOfPages()}`,
      width - 12,
      height - 7,
      { align: "right" },
    );
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
