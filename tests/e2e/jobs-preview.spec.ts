import jsQR from "jsqr";
import { createCanvas, loadImage } from "@napi-rs/canvas";
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
  await expect(
    page.getByRole("status").filter({ hasText: "Posting saved." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close Posting", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Posting changed to closed." }),
  ).toBeVisible();
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

for (const width of [360, 390, 430, 768, 1024, 1440]) {
  test(`campaign links and QR downloads preserve attribution at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dev-preview/jobs/sample-job-001");
    await page
      .getByRole("button", { name: "Campaign link & QR", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", {
        name: "Recruitment campaign link",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByLabel("Campaign name", { exact: true })
      .fill("linkedin-october-2026");
    await page
      .getByRole("button", { name: "Create campaign link", exact: true })
      .click();
    const link = await page
      .getByLabel("Shareable URL", { exact: true })
      .inputValue();
    const url = new URL(link);
    expect(url.pathname).toBe(
      "/dev-preview/careers/sample-customer-support-role-1-2026-09-30-01",
    );
    expect(url.searchParams.get("source")).toBe("linkedin");
    expect(url.searchParams.get("campaign")).toBe("linkedin-october-2026");
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download QR", exact: true })
      .click();
    const qr = await download;
    expect(qr.suggestedFilename()).toBe(
      "taskwaveph-linkedin-linkedin-october-2026-qr.png",
    );
    const image = await loadImage((await qr.path())!);
    for (const size of [1024, 320]) {
      const canvas = createCanvas(size, size);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, size, size);
      const pixels = context.getImageData(0, 0, size, size);
      expect(jsQR(new Uint8ClampedArray(pixels.data), size, size)?.data).toBe(
        link,
      );
      const center = context.getImageData(
        size / 2 - size * 0.05,
        size / 2 - size * 0.05,
        size * 0.1,
        size * 0.1,
      ).data;
      expect(
        Array.from(
          { length: center.length / 4 },
          (_, i) => center[i * 4 + 2] > center[i * 4] + 30,
        ).some(Boolean),
      ).toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const modal = page.getByRole("dialog", {
      name: "Recruitment campaign link",
      exact: true,
    });
    const bounds = await modal.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Campaign link & QR", exact: true }),
    ).toBeFocused();
    await page.goto(link);
    const apply = page.getByRole("link", {
      name: "Apply for This Role",
      exact: true,
    });
    await expect(apply).toHaveAttribute(
      "href",
      /source=linkedin.*campaign=linkedin-october-2026/,
    );
    await apply.click();
    await expect(
      page.getByLabel("Position Interested In", { exact: true }),
    ).toHaveValue("Sample Customer Support Role 1");
    await expect(page.locator('input[name="source"]')).toHaveValue("linkedin");
    await expect(page.locator('input[name="campaign"]')).toHaveValue(
      "linkedin-october-2026",
    );
  });
}
test("draft jobs have no campaign builder", async ({ page }) => {
  await page.goto("/dev-preview/jobs/sample-job-015");
  await expect(
    page.getByRole("button", { name: "Campaign link & QR", exact: true }),
  ).toHaveCount(0);
});

test("logo QR with maximum-length campaign and job slug remains scannable", async ({
  page,
}) => {
  await page.goto("/dev-preview/jobs/new");
  await fillJob(page, "z".repeat(200));
  await page.getByRole("button", { name: "Save Posting", exact: true }).click();
  await expect(page).toHaveURL(/\/dev-preview\/jobs\/sample-job-/);
  await page
    .getByRole("button", { name: "Publish Posting", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Campaign link & QR", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Campaign link & QR", exact: true })
    .click();
  await page.getByLabel("Campaign name", { exact: true }).fill("a".repeat(100));
  await page
    .getByRole("button", { name: "Create campaign link", exact: true })
    .click();
  const link = await page
    .getByLabel("Shareable URL", { exact: true })
    .inputValue();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download QR", exact: true }).click();
  const image = await loadImage((await (await download).path())!);
  const canvas = createCanvas(320, 320);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, 320, 320);
  expect(
    jsQR(
      new Uint8ClampedArray(context.getImageData(0, 0, 320, 320).data),
      320,
      320,
    )?.data,
  ).toBe(link);
});

test("sample readable URLs identify roles and preserve campaign attribution through Apply", async ({
  page,
}) => {
  const slug = "sample-customer-support-role-1-2026-09-30-01";
  await page.goto(
    `/dev-preview/careers/${slug}?source=linkedin&campaign=slug-test&email=private@example.invalid`,
  );
  await expect(
    page.getByRole("heading", {
      name: "Sample Customer Support Role 1",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Apply for This Role", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(
      `/dev-preview/job-apply/${slug}\\?source=linkedin&campaign=slug-test$`,
    ),
  );
  await expect(
    page.getByLabel("Position Interested In", { exact: true }),
  ).toHaveValue("Sample Customer Support Role 1");
  await expect(page.locator('input[name="jobId"]')).toHaveValue(
    "sample-job-001",
  );
  await expect(page.locator('input[name="source"]')).toHaveValue("linkedin");
});

test("job editor formats flat bullets and preserves literal markers on mobile and desktop", async ({
  page,
}) => {
  await page.goto("/dev-preview/jobs/new");
  await fillJob(page, "Formatted Sample Role");
  const description = page.getByRole("textbox", {
    name: "Description",
    exact: true,
  });
  await description.fill("");
  await description.pressSequentially("- ");
  await description.pressSequentially("Help our customers every day.");
  await expect(description.locator("ul li")).toHaveCount(1);
  await description.press("Enter");
  await description.pressSequentially("Communicate clearly with teammates.");
  await expect(description.locator("ul li")).toHaveCount(2);
  await description.press("Enter");
  await description.press("Enter");
  await page
    .getByRole("group", { name: "Description formatting" })
    .getByRole("button", { name: "Bold", exact: true })
    .click();
  await description.pressSequentially("Bold text");
  await expect(description.locator("strong")).toHaveText("Bold text");
  await page
    .getByRole("group", { name: "Description formatting" })
    .getByRole("button", { name: "Bold", exact: true })
    .click();
  await description.pressSequentially(" *literal* _literal_");
  await description.press("ControlOrMeta+i");
  await description.pressSequentially(" Italic text");
  await description.press("ControlOrMeta+i");
  await expect(description.locator("em")).toHaveText(" Italic text");
  await description.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData(
      "text/html",
      '<p><strong>Pasted bold</strong><a href="https://example.com"> safe text</a><img src="invalid" /></p>',
    );
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData,
      }),
    );
  });
  await expect(description.locator("a, img")).toHaveCount(0);
  await expect(description).toContainText("Pasted bold");
  await description.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", "x".repeat(10001));
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData,
      }),
    );
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "exceeds the content limit" }),
  ).toBeVisible();
  await expect(description).toContainText("Pasted bold");
  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Save Posting", exact: true }).click();
  await expect(page).toHaveURL(/\/dev-preview\/jobs\/sample-job-/);
  await expect(description.locator("ul li")).toHaveCount(2);
  await expect(description.locator("strong")).toHaveText([
    "Bold text",
    "Pasted bold",
  ]);
  await page
    .getByRole("button", { name: "Publish Posting", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await page
    .getByRole("link", { name: "Preview Careers", exact: true })
    .click();
  await page
    .locator('[data-slot="card"]')
    .filter({
      has: page.getByRole("heading", {
        name: "Formatted Sample Role",
        exact: true,
      }),
    })
    .getByRole("link", { name: /View Role/ })
    .click();
  const body = page.locator("section").filter({
    has: page.getByRole("heading", { name: "About the role", exact: true }),
  });
  await expect(body.locator("ul li")).toHaveCount(2);
  await expect(body.locator("strong")).toHaveText(["Bold text", "Pasted bold"]);
  await expect(body.locator("em")).toHaveText(" Italic text");
  await expect(body).toContainText("*literal* _literal_");
});

test("formatted edits preserve the caret and undo history inside existing text", async ({
  page,
}) => {
  await page.goto("/dev-preview/jobs/new");
  const description = page.getByRole("textbox", {
    name: "Description",
    exact: true,
  });
  await description.fill("ABCDEFGHIJKLMNOPQRSTUV");
  await description.press("ControlOrMeta+a");
  await page
    .getByRole("group", { name: "Description formatting" })
    .getByRole("button", { name: "Bold", exact: true })
    .click();
  await expect(description.locator("strong")).toHaveText(
    "ABCDEFGHIJKLMNOPQRSTUV",
  );
  await description.evaluate(async (element) => {
    // Let the toolbar's scheduled focus finish before placing a native text selection.
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const range = document.createRange();
    range.setStart(element.querySelector("strong")!.firstChild!, 1);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
  await description.pressSequentially("xy", { delay: 80 });
  await expect(description).toHaveText("AxyBCDEFGHIJKLMNOPQRSTUV");
  await description.press("ControlOrMeta+z");
  await expect(description).toHaveText("ABCDEFGHIJKLMNOPQRSTUV");
  await page.getByRole("link", { name: "Back to jobs", exact: true }).click();
  const warning = page.getByRole("alertdialog");
  await expect(warning).toBeVisible();
  await warning
    .getByRole("button", { name: "Keep editing", exact: true })
    .click();
  await expect(description.locator("strong")).toHaveText(
    "ABCDEFGHIJKLMNOPQRSTUV",
  );
});

test("opening an untouched job editor does not create unsaved changes", async ({
  page,
}) => {
  await page.goto("/dev-preview/jobs/new");
  await expect(
    page.getByRole("textbox", { name: "Description", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to jobs", exact: true }).click();
  await expect(page).toHaveURL(/\/dev-preview\/jobs$/);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});
