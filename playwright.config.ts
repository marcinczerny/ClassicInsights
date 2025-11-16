import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

// Load .env.test explicitly and override any existing env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  snapshotDir: "./e2e/snapshots",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3007",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Ensure each test file gets a fresh browser context
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        testIdAttribute: "data-testid",
      },
    },
  ],

  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3007",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_KEY: process.env.SUPABASE_KEY!,
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL!,
      PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY!,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
      E2E_USERNAME: process.env.E2E_USERNAME!,
      E2E_PASSWORD: process.env.E2E_PASSWORD!,
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID!,
      BASE_URL: process.env.BASE_URL!,
    },
  },

  reporter: process.env.CI ? [["github"], ["html"]] : [["list"], ["html", { open: "never" }]],
});
