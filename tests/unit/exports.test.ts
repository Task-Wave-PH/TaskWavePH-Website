import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
  createExport,
  toCsv,
  MAX_EXPORT_ROWS,
  exportColumns,
  EXPORT_HEADER_ROW,
} from "../../features/applications/export";
import { previewApplicants } from "../../features/applications/preview-data";
import { sampleResumeBytes } from "../../features/applications/sample-resume";
const assets = {
  logoDataUrl: `data:image/png;base64,${readFileSync("public/logo/taskwaveph-symbol.png").toString("base64")}`,
  regularFont: readFileSync(
    "public/fonts/poppins/Poppins-Regular.ttf",
  ).toString("base64"),
  boldFont: readFileSync("public/fonts/poppins/Poppins-SemiBold.ttf").toString(
    "base64",
  ),
};
describe("applicant exports", () => {
  it("exports referrals safely and leaves historical referrals blank", async () => {
    const row = previewApplicants()[0];
    row.data.referredBy = "=REF-001";
    expect(toCsv([row])).toContain('"\'=REF-001"');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      new Uint8Array(await createExport([row], "xlsx", { assets })).buffer,
    );
    const column = exportColumns.indexOf("Referred By") + 1;
    expect(
      workbook
        .getWorksheet("Applicants")!
        .getRow(EXPORT_HEADER_ROW + 1)
        .getCell(column).value,
    ).toBe("=REF-001");
    delete row.data.referredBy;
    expect(toCsv([row])).toMatch(/,""\r\n$/);
  });
  it("quotes cells, handles line breaks and protects spreadsheet formulas", () => {
    const row = previewApplicants()[0];
    row.data.firstName = '=HYPERLINK("bad")';
    row.notes = "Line 1\nLine 2, with commas";
    row.data.message = "  @formula";
    const csv = toCsv([row]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"Line 1\nLine 2, with commas"');
    expect(csv).toContain('"\'  @formula"');
    expect(csv).not.toContain("storageId");
    expect(csv).not.toContain("fingerprint");
  });
  it("exports all supplied rows and produces readable styled Excel", async () => {
    const rows = previewApplicants();
    rows[0].data.firstName = "=1+1";
    const bytes = await createExport(rows, "xlsx", { assets });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(bytes).buffer);
    const sheet = workbook.getWorksheet("Applicants")!;
    expect(sheet.rowCount).toBe(50 + EXPORT_HEADER_ROW);
    expect(sheet.views[0]).toMatchObject({
      state: "frozen",
      ySplit: EXPORT_HEADER_ROW,
    });
    expect(sheet.getRow(EXPORT_HEADER_ROW).getCell(1).font.bold).toBe(true);
    expect(sheet.getRow(EXPORT_HEADER_ROW).getCell(1).fill).toMatchObject({
      fgColor: { argb: "FF0A1D3B" },
    });
    expect(sheet.getRow(EXPORT_HEADER_ROW + 1).getCell(3).value).toBe("=1+1");
    expect(sheet.getRow(EXPORT_HEADER_ROW + 1).getCell(6).value).toBe(
      rows[0].data.phone,
    );
    expect(sheet.autoFilter).toBeTruthy();
    expect(sheet.getCell("B1").value).toBe("TaskWavePH");
    expect(sheet.getImages()).toHaveLength(1);
  });
  it("rejects oversized exports and still exports headings for an empty list", async () => {
    await expect(
      createExport(
        Array(MAX_EXPORT_ROWS + 1).fill(previewApplicants()[0]),
        "csv",
      ),
    ).rejects.toThrow("EXPORT_TOO_LARGE");
    expect(toCsv([])).toContain("Application ID");
  });
  it("provides a valid synthetic two-page PDF fixture", () => {
    const text = new TextDecoder().decode(sampleResumeBytes());
    expect(text).toContain("/Count 2");
    const xref = Number(text.match(/startxref\n(\d+)/)![1]);
    expect(text.slice(xref)).toMatch(/^xref/);
  });
});

it("creates a branded multipage PDF with embedded fonts", async () => {
  const bytes = await createExport(previewApplicants(), "pdf", {
    assets,
    filters: { from: "2026-09-01", to: "2026-09-30" },
    status: "New",
    preview: true,
  });
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loading = getDocument({ data: bytes, useSystemFonts: true });
  const pdf = await loading.promise;
  expect(pdf.numPages).toBeGreaterThan(1);
  const first = await pdf.getPage(1);
  const content = await first.getTextContent();
  const text = content.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ");
  expect(text).toContain("TaskWavePH");
  expect(text).toContain("From: 2026-09-01");
  expect(text).toContain("Sample Applicant 1");
  const last = await pdf.getPage(pdf.numPages);
  expect(
    (await last.getTextContent()).items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" "),
  ).toContain("Sample Applicant 50");
  await loading.destroy();
});

it("creates a branded empty PDF with a readable empty state", async () => {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const emptyLoading = getDocument({
    data: await createExport([], "pdf", { assets }),
  });
  const empty = await emptyLoading.promise;
  expect(
    (await (await empty.getPage(1)).getTextContent()).items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" "),
  ).toContain("No applications match");
  await emptyLoading.destroy();
});
