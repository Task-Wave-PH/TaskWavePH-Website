import { defineConfig, devices } from "@playwright/test";
// Requires an already running localhost Next.js DEVELOPMENT server.
const port = process.env.PLAYWRIGHT_PREVIEW_PORT ?? "3000";
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/preview",
  testMatch: [
    "**/applicant-preview.spec.ts",
    "**/jobs-preview.spec.ts",
    "**/admin-access.spec.ts",
    "**/settings-preview.spec.ts",
  ],
  workers: 1,
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
