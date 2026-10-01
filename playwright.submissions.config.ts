import { defineConfig, devices } from "@playwright/test";
import { requireDevelopmentTarget } from "./scripts/development-target.mjs";
requireDevelopmentTarget();
// Requires an already configured, running DEVELOPMENT Convex backend.
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/submissions",
  testMatch: "**/submissions-live.spec.ts",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3101", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NEXT_BUILD_DIR: ".next-verify",
      SUBMISSIONS_ENABLED: "true",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    },
  },
});
