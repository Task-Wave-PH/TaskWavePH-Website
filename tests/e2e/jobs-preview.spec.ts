import { test, expect } from "@playwright/test";
async function fillJob(page: import("@playwright/test").Page, title: string) {
  await page.getByLabel("Job Title", { exact: true }).fill(title);
  await page.getByLabel("Location", { exact: true }).fill("Sample Cebu");
  await page
    .getByLabel("Description", { exact: true })
    .fill("This is a sample role for preview workflow verification only.");
  await page
    .getByLabel("Responsibilities", { exact: true })
    .fill("Coordinate sample tasks and communicate clearly.");
  await page
    .getByLabel("Requirements", { exact: true })
    .fill("Relevant sample skills and clear communication.");
}
test("draft creation, publishing, role application, editing and closure work in sample preview", async ({
  page,
}) => {
  await page.goto("/dev-preview/jobs");
  await expect(
    page.getByRole("complementary", { name: "Cookie notice", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Create Job", exact: true }).click();
  await fillJob(page, "Sample Workflow Specialist");
  await page.getByRole("button", { name: "Save Posting", exact: true }).click();
  await expect(page).toHaveURL(/\/dev-preview\/jobs\/sample-job-/);
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("link", { name: "Preview Careers", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dev-preview\/careers$/);
  await expect(
    page.getByRole("heading", {
      name: "Sample Workflow Specialist",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Manage sample jobs", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Sample Workflow Specialist", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish Posting", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("button", { name: "Publish Posting", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByText("Published", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Preview Careers", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dev-preview\/careers$/);
  const card = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", {
      name: "Sample Workflow Specialist",
      exact: true,
    }),
  });
  await card.getByRole("link", { name: /View Role/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Sample Workflow Specialist",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Apply for This Role", exact: true })
    .click();
  await expect(
    page.getByLabel("Position Interested In", { exact: true }),
  ).toHaveValue("Sample Workflow Specialist");
  await expect(
    page.getByLabel("Position Interested In", { exact: true }),
  ).toHaveAttribute("readonly", "");
  await page
    .getByRole("link", { name: "Manage sample jobs", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Sample Workflow Specialist", exact: true })
    .click();
  await page.getByLabel("Salary (optional)").fill("Sample salary only");
  await expect(
    page.getByRole("button", { name: "Close Posting", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Save Posting", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Close Posting", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Close Posting", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("link", { name: "Preview Careers", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dev-preview\/careers$/);
  await expect(
    page.getByRole("heading", {
      name: "Sample Workflow Specialist",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("link", { name: "Manage sample jobs", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Sample Workflow Specialist", exact: true }),
  ).toHaveCount(0);
});

test("sample roles paginate, filter and appear on localhost Careers", async ({
  page,
}) => {
  await page.goto("/dev-preview/careers");
  await expect(
    page.getByRole("combobox", { name: "Service area", exact: true }),
  ).toContainText("All service areas");
  await expect(page.getByRole("link", { name: /View Role/ })).toHaveCount(12);
  await page
    .getByRole("button", { name: "Load More Roles", exact: true })
    .click();
  await expect(page.getByRole("link", { name: /View Role/ })).toHaveCount(14);
  await page
    .getByRole("combobox", { name: "Service area", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Web Development", exact: true })
    .click();
  await page.getByRole("button", { name: "Filter Roles", exact: true }).click();
  await expect(page.getByRole("link", { name: /View Role/ })).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Work arrangement", exact: true })
    .click();
  await page.getByRole("option", { name: "Remote", exact: true }).click();
  await page.getByRole("button", { name: "Filter Roles", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "No open roles match these filters",
  );
  await page.goto("/careers");
  await expect(page.getByRole("link", { name: /View Role/ })).toHaveCount(12);
  await expect(
    page.getByText(/Local UI preview · Sample jobs only/),
  ).toBeVisible();
});

test("careers preview and job editor fit supported screen widths", async ({
  page,
}) => {
  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    for (const route of [
      "/careers",
      "/dev-preview/careers",
      "/dev-preview/careers/sample-job-001",
      "/dev-preview/jobs/new",
    ]) {
      await page.goto(route);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (route === "/careers") {
        const controls = [
          page.getByRole("combobox", { name: "Service area", exact: true }),
          page.getByRole("combobox", { name: "Work arrangement", exact: true }),
          page.getByRole("button", { name: "Filter Roles", exact: true }),
        ];
        const boxes = await Promise.all(
          controls.map((control) => control.boundingBox()),
        );
        for (const box of boxes) {
          expect(box).not.toBeNull();
          expect(box!.height).toBe(44);
        }
        if (width >= 1024) {
          expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThanOrEqual(1);
          expect(Math.abs(boxes[0]!.y - boxes[2]!.y)).toBeLessThanOrEqual(1);
        } else if (width < 640) {
          expect(boxes[1]!.y).toBeGreaterThan(boxes[0]!.y + boxes[0]!.height);
          expect(boxes[2]!.y).toBeGreaterThan(boxes[1]!.y + boxes[1]!.height);
        }
        if (width >= 768) {
          const actions = page.getByRole("link", { name: /View Role/ });
          const first = await actions.nth(0).boundingBox();
          const second = await actions.nth(1).boundingBox();
          expect(Math.abs(first!.y - second!.y)).toBeLessThanOrEqual(1);
        }
      }
      if (route === "/dev-preview/careers/sample-job-001") {
        const back = await page
          .getByRole("link", { name: "Back to careers", exact: true })
          .boundingBox();
        const chips = await page
          .locator('[data-slot="badge"]')
          .first()
          .boundingBox();
        expect(back!.height).toBeGreaterThanOrEqual(44);
        expect(chips!.y - (back!.y + back!.height)).toBeGreaterThanOrEqual(24);
        await expect(
          page.getByRole("link", { name: "Apply for This Role", exact: true }),
        ).toBeVisible();
      }
      if (route === "/careers") {
        await page.locator("main img").scrollIntoViewIfNeeded();
        await expect(page.locator("main img")).toHaveJSProperty(
          "complete",
          true,
        );
        await page.screenshot({
          path: test.info().outputPath(`careers-${width}.png`),
          fullPage: true,
        });
      }
    }
  }
});

test("localhost Careers reflects sample admin publication and closure", async ({
  page,
}) => {
  await page.goto("/dev-preview/jobs/new");
  await fillJob(page, "Local Careers Test Role");
  await page.getByRole("button", { name: "Save Posting", exact: true }).click();
  await page
    .getByRole("button", { name: "Publish Posting", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByText("Published", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "View Careers Page", exact: true })
    .click();
  await expect(page).toHaveURL(/\/careers$/);
  await expect(
    page.getByRole("heading", { name: "Local Careers Test Role", exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await page
    .getByRole("link", { name: "Manage sample jobs", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Local Careers Test Role", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Close Posting", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("link", { name: "View Careers Page", exact: true })
    .click();
  await expect(page).toHaveURL(/\/careers$/);
  await expect(
    page.getByRole("heading", { name: "Local Careers Test Role", exact: true }),
  ).toHaveCount(0);
});
