import { describe, expect, it } from "vitest";
import { previewApplicants } from "@/features/applications/preview-data";
import {
  missingScreeningInformation,
  screeningRequest,
} from "@/features/applications/screening";
import {
  exportColumns,
  exportValues,
  toCsv,
} from "@/features/applications/export";

describe("screening guidance", () => {
  it("handles historical records and does not treat zero experience as missing", () => {
    const record = previewApplicants()[0];
    record.data.experience = 0;
    const missing = missingScreeningInformation(record);
    expect(missing).toContain("possible start date / availability");
    expect(missing).not.toContain("years of active work experience");
    expect(missing).not.toContain("a PDF CV (up to 2 MB)");
    expect(screeningRequest(record)).toContain(
      "work arrangement stated in the job posting",
    );
    expect(screeningRequest(record)).not.toContain(
      "recruitment.ph@oneminers.com",
    );
  });
  it("recognizes complete core details without requiring salary history or relocation", () => {
    const record = previewApplicants()[1];
    Object.assign(record.data, {
      expectedSalary: "Negotiable",
      strengthOne: "Communication",
      strengthTwo: "Organization",
    });
    expect(missingScreeningInformation(record)).toEqual([]);
    expect(screeningRequest(record)).toBe("");
    delete record.resumeFile;
    record.data.resume = "https://example.com/cv";
    expect(missingScreeningInformation(record)).toEqual([
      "a PDF CV (up to 2 MB)",
    ]);
  });
  it("exports screening fields with historical blanks and formula protection", () => {
    const record = previewApplicants()[0];
    const index = exportColumns.indexOf("Expected Salary");
    expect(exportValues(record)[index]).toBe("");
    record.data.expectedSalary = "=1+1";
    expect(exportValues(record)[index]).toBe("=1+1");
    expect(toCsv([record])).toContain('"\'=1+1"');
    expect(exportValues(record)).toHaveLength(exportColumns.length);
  });
});
