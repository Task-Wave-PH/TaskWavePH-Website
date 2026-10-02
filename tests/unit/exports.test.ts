import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
  createExport,
  toCsv,
  MAX_EXPORT_ROWS,
  exportColumns,
} from "../../features/applications/export";
import { previewApplicants } from "../../features/applications/preview-data";
import { sampleResumeBytes } from "../../features/applications/sample-resume";
describe("applicant exports", () => {
  it("exports referrals safely and leaves historical referrals blank", async () => {
    const row = previewApplicants()[0];
    row.data.referredBy = "=REF-001";
    expect(toCsv([row])).toContain('"\'=REF-001"');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      new Uint8Array(await createExport([row], "xlsx")).buffer,
    );
    const column = exportColumns.indexOf("Referred By") + 1;
    expect(
      workbook.getWorksheet("Applicants")!.getRow(2).getCell(column).value,
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
    const bytes = await createExport(rows, "xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(bytes).buffer);
    const sheet = workbook.getWorksheet("Applicants")!;
    expect(sheet.rowCount).toBe(51);
    expect(sheet.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(sheet.getRow(1).getCell(1).font.bold).toBe(true);
    expect(sheet.getRow(1).getCell(1).fill).toMatchObject({
      fgColor: { argb: "FF071B3B" },
    });
    expect(sheet.getRow(2).getCell(3).value).toBe("=1+1");
    expect(sheet.getRow(2).getCell(6).value).toBe(rows[0].data.phone);
    expect(sheet.autoFilter).toBeTruthy();
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
