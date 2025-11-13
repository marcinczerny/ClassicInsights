import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  snapshotDir: "./e2e/snapshots",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3007",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Configure the test id attribute for this project
        testIdAttribute: "data-testid",
      },
    },
  ],

  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3007",
    reuseExistingServer: false,
    timeout: 120000,
  },

  reporter: process.env.CI ? [["github"], ["html"]] : [["list"], ["html", { open: "never" }]],
});
