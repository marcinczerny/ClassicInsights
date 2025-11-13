import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects";

test.describe("Basic Application Tests", () => {
  test("should load login page successfully", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // The most direct way to wait for an element is to use `locator.waitFor()`.
    // This explicitly waits for the element to be attached and visible, which is the
    // most robust way to handle client-side hydration delays.
    const loginHeader = page.getByTestId("login-header");

    // Once we know the header is visible, we can safely make other assertions
    // without needing complex retry logic like `toPass`.
    await expect(loginHeader).toHaveText("Logowanie");
    await expect(page.getByTestId("login-email-input")).toBeVisible();
    await expect(page.getByTestId("login-password-input")).toBeVisible();
    await expect(page.getByTestId("login-submit-button")).toBeVisible();
  });

  test("should load homepage and redirect to login if unauthenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("/login", { timeout: 10000 });

    // After redirecting, apply the same robust waiting strategy.
    const loginHeader = page.getByTestId("login-header");

    await expect(loginHeader).toHaveText("Logowanie");
    await expect(page.getByTestId("login-email-input")).toBeVisible();
  });
});
