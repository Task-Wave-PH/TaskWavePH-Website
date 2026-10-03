import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
for (const width of [360, 390, 430, 768, 1024, 1440]) {
  test(`preview exit requires confirmation and restores focus at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dev-preview/applications");
    if (width < 768)
      await page
        .getByRole("button", { name: "Toggle Sidebar", exact: true })
        .click();
    const account = page.getByRole("button", {
      name: "Sample staff account menu",
      exact: true,
    });
    await account.click();
    await page
      .getByRole("menuitem", { name: "Exit preview", exact: true })
      .click();
    const dialog = page.getByRole("alertdialog", {
      name: "Exit preview?",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Cancel", exact: true }),
    ).toBeFocused();
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page).toHaveURL(/\/dev-preview\/applications$/);
    await expect(account).toBeFocused();
    await account.click();
    await page
      .getByRole("menuitem", { name: "Exit preview", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Exit preview", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
  });
}
test("failed sample export shows safe feedback and re-enables actions", async ({
  page,
}) => {
  await page.addInitScript(() => {
    URL.createObjectURL = () => {
      throw new Error("Private diagnostic fixture");
    };
  });
  await page.goto("/dev-preview/applications");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Excel workbook", exact: true })
    .click();
  const toast = page
    .locator("[data-sonner-toast]")
    .filter({ hasText: "Unable to export. Check your access and try again." });
  await expect(toast).toBeVisible();
  await expect(page.getByText("Private diagnostic fixture")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Export", exact: true }),
  ).toBeEnabled();
});
test("malformed CV reports an unreadable file without enabling viewer controls", async ({
  page,
}) => {
  await page.route("**/dev-preview/sample-cv?mode=view", (route) =>
    route.fulfill({
      contentType: "application/pdf",
      body: "%PDF-1.4\n%%EOF",
    }),
  );
  await page.goto("/dev-preview/applications/sample-001");
  await page.getByRole("tab", { name: "CV", exact: true }).click();
  await expect(
    page.getByRole("tabpanel", { name: "CV", exact: true }).getByRole("alert"),
  ).toContainText("This CV is not a readable PDF");
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Download CV" })).toBeVisible();
});
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
    page.getByText("Screening information", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy missing information request" }),
  ).toBeVisible();
  await expect(
    page.getByText("sample-1@example.invalid", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Status", { exact: true }).click();
  await page.getByRole("option", { name: "Shortlisted", exact: true }).click();
  await page.getByLabel("Internal notes").fill("Reviewed in the preview.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Application review saved." }),
  ).toBeVisible();
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Sample preview only" }),
  ).toBeVisible();
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
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Application deleted." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sample Applicant 1", exact: true }),
  ).toHaveCount(0);
});
test("branded exports include unloaded rows and honor applied month and status filters", async ({
  page,
}) => {
  await page.goto("/dev-preview/applications");
  const allPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Excel workbook", exact: true })
    .click();
  const all = new ExcelJS.Workbook();
  await all.xlsx.readFile((await (await allPromise).path())!);
  expect(all.getWorksheet("Applicants")!.rowCount).toBe(56);
  await page
    .getByRole("combobox", { name: "Filter by status", exact: true })
    .click();
  await page.getByRole("option", { name: "New", exact: true }).click();
  await page.getByLabel("Submission month", { exact: true }).fill("2026-09");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  const excelPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Excel workbook", exact: true })
    .click();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await (await excelPromise).path())!);
  const sheet = workbook.getWorksheet("Applicants")!;
  expect(sheet.rowCount).toBe(13);
  expect(sheet.getRow(7).getCell(24).value).toBe("New");
  expect(sheet.getCell("B1").value).toBe("TaskWavePH");
  expect(sheet.getCell("B4").value).toContain("From: 2026-09-01");
  expect(sheet.getImages()).toHaveLength(1);
  const pdfPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("menuitem", { name: "PDF report", exact: true }).click();
  const pdf = await pdfPromise;
  const bytes = await readFile((await pdf.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
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
    if (width === 360) {
      await page
        .getByLabel("Internal notes")
        .fill("Synthetic mobile toast check.");
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      const toast = page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "Application review saved." });
      await expect(toast).toBeVisible();
      await expect
        .poll(async () => {
          const bounds = await toast.boundingBox();
          return !!bounds && bounds.x >= 0 && bounds.x + bounds.width <= width;
        })
        .toBe(true);
    }
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

for (const width of [360, 390, 430, 768, 1024, 1440]) {
  test(`clean filters and advanced toggle fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dev-preview/applications");
    await expect(page.getByLabel("Campaign", { exact: true })).toBeHidden();
    await expect(
      page.getByText("Campaign results", { exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Advanced filters", exact: true })
      .click();
    await expect(page.getByLabel("Campaign", { exact: true })).toBeVisible();
    await page.getByLabel("Campaign", { exact: true }).fill("sample-campaign");
    await page.getByLabel("Submission month", { exact: true }).fill("2026-09");
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await expect(
      page.getByText("Showing 20 of 30 sample records.", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Advanced filters", exact: true })
      .click();
    await expect(page.getByLabel("Campaign", { exact: true })).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel("Source", { exact: true }).fill("linkedin");
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await expect(
      page.getByText("No records found.", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .click();
    await expect(
      page.getByText("Showing 20 of 50 sample records.", { exact: true }),
    ).toBeVisible();
  });
}

for (const query of [
  "TW-PREVIEW-041",
  "sample-41@example.invalid",
  "Sample Applicant 41",
]) {
  test(`one search input finds unloaded applicants by ${query}`, async ({
    page,
  }) => {
    await page.goto("/dev-preview/applications");
    await page.getByLabel("Search applicants", { exact: true }).fill(query);
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Sample Applicant 41", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Showing 1 of 1 sample records.", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/dev-preview\/applications$/);
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .click();
    await expect(
      page.getByText("Showing 20 of 50 sample records.", { exact: true }),
    ).toBeVisible();
  });
}
test("job title options and suggested/custom attribution filter matching records", async ({
  page,
}) => {
  await page.goto("/dev-preview/applications");
  await page
    .getByRole("button", { name: "Advanced filters", exact: true })
    .click();
  await page.getByLabel("Job", { exact: true }).click();
  await page
    .getByRole("option", {
      name: "Sample Customer Support Role 1 · Published",
      exact: true,
    })
    .click();
  await page.getByLabel("Source", { exact: true }).fill("development-preview");
  await page.getByLabel("Campaign", { exact: true }).fill("sample-campaign");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(
    page.getByText("Showing 3 of 3 sample records.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('#known-sources option[value="development-preview"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('#known-campaigns option[value="sample-campaign"]'),
  ).toHaveCount(1);
  await page.getByLabel("Campaign", { exact: true }).fill("custom-code");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(
    page.getByText("No records found.", { exact: true }),
  ).toBeVisible();
});
test("lead follow-up saves, contributes to overdue dashboard totals, and clears", async ({
  page,
}) => {
  await page.goto("/dev-preview/businessLeads/sample-lead-001");
  await page
    .getByLabel("Next follow-up (optional)", { exact: true })
    .fill("2026-01-01");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  const card = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText("Overdue enquiries", { exact: true }) });
  await expect(card.locator("p").filter({ hasText: /^1$/ })).toBeVisible();
  await page
    .getByRole("link", { name: "Review enquiries", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Sample business 1", exact: true })
    .click();
  await expect(
    page.getByLabel("Next follow-up (optional)", { exact: true }),
  ).toHaveValue("2026-01-01");
  await page.getByLabel("Next follow-up (optional)", { exact: true }).fill("");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
});
