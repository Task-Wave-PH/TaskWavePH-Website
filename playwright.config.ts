import { defineConfig, devices } from "@playwright/test";
import { browserTestEnv } from "./scripts/browser-test-env.mjs";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/production",
  testIgnore: [
    "**/admin-access.spec.ts",
    "**/submissions-live.spec.ts",
    "**/applicant-preview.spec.ts",
    "**/jobs-preview.spec.ts",
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: browserTestEnv,
  },
});
