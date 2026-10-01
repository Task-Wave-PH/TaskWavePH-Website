import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
test("sample applicant details support review, PDF viewing and confirmed deletion", async ({
  page,
}) => {
  await page.goto("/dev-preview/applications");
  await page
    .getByRole("link", { name: "Sample Applicant 1", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sample Applicant 1" }),
  ).toBeVisible();
  await expect(
    page.getByText("sample-1@example.invalid", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Status", { exact: true }).click();
  await page.getByRole("option", { name: "Shortlisted", exact: true }).click();
  await page.getByLabel("Internal notes").fill("Reviewed in the preview.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "CV", exact: true }).click();
  await expect(
    page.getByRole("tabpanel", { name: "CV", exact: true }).locator("canvas"),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 2", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Sample experience - Page 2", { exact: true }),
  ).toBeVisible();
  const cvPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download CV" }).click();
  const cv = await cvPromise;
  expect(
    (await readFile((await cv.path())!)).toString().startsWith("%PDF-"),
  ).toBe(true);
  await page.getByRole("link", { name: "Back to applications" }).click();
  const row = page.getByRole("row").filter({
    has: page.getByRole("link", { name: "Sample Applicant 1", exact: true }),
  });
  await expect(row).toContainText("Shortlisted");
  await page
    .getByRole("link", { name: "Sample Applicant 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete applicant", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sample Applicant 1" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete applicant", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm deletion", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dev-preview\/applications$/);
  await expect(
    page.getByRole("link", { name: "Sample Applicant 1", exact: true }),
  ).toHaveCount(0);
});
test("exports include unloaded rows and honor the status filter", async ({
  page,
}) => {
  await page.goto("/dev-preview/applications");
  await expect(
    page.getByText("Showing 20 of 50 sample records.", { exact: false }),
  ).toBeVisible();
  const csvPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csv = await csvPromise;
  const text = await readFile((await csv.path())!, "utf8");
  expect(text.match(/TW-PREVIEW-/g)).toHaveLength(50);
  await page
    .getByRole("combobox", { name: "Filter by status", exact: true })
    .click();
  await page.getByRole("option", { name: "New", exact: true }).click();
  const excelPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Excel" }).click();
  const excel = await excelPromise;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await excel.path())!);
  const sheet = workbook.getWorksheet("Applicants")!;
  expect(sheet.rowCount).toBe(14);
  expect(sheet.getRow(2).getCell(24).value).toBe("New");
  expect(sheet.getRow(1).getCell(1).font.bold).toBe(true);
});
test("details fit a mobile screen and handle missing CVs and records", async ({
  page,
}) => {
  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dev-preview/applications/sample-006");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "CV", exact: true }).click();
  await expect(page.getByText("No PDF CV was provided.")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.goto("/dev-preview/applications/sample-001");
  await page.getByRole("tab", { name: "CV", exact: true }).click();
  await expect(
    page.getByRole("tabpanel", { name: "CV", exact: true }).locator("canvas"),
  ).toBeVisible({ timeout: 30000 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.goto("/dev-preview/applications/not-a-record");
  await expect(
    page.getByRole("heading", { name: "Applicant not found" }),
  ).toBeVisible();
});
