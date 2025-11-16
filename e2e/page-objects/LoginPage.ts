import type { Page, Locator } from "@playwright/test";

/**
 * LoginPage - Page Object Model for login page
 * Handles authentication functionality using resilient test selectors
 */
export class LoginPage {
  readonly page: Page;

  // Locators using data-testid attributes
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators using data-testid convention
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await this.page.goto("/login");
    await this.page.waitForLoadState("load", { timeout: 5000 });

    const currentUrl = this.page.url();
    if (!currentUrl.includes("/login")) {
      throw new Error(
        `Expected to be on login page, but got: ${currentUrl}. User might already be authenticated.`
      );
    }
  }

  /**
   * Clear authentication state (cookies, localStorage, sessionStorage)
   */
  async clearAuthState(): Promise<void> {
    // First, try to logout via API if we're on a page that can make requests
    try {
      const currentUrl = this.page.url();
      if (currentUrl.includes("localhost:3007")) {
        await this.page.request.post("/api/auth/logout");
      }
    } catch {
      // Ignore logout failures (normal if not logged in)
    }

    // Clear all cookies
    await this.page.context().clearCookies();

    // Try to clear localStorage and sessionStorage (may fail due to security restrictions)
    try {
      await this.page.evaluate(() => {
        // Clear any Supabase-related storage
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.includes("supabase") || key.includes("auth"))) {
            localStorage.removeItem(key);
          }
        }
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && (key.includes("supabase") || key.includes("auth"))) {
            sessionStorage.removeItem(key);
          }
        }
      });
    } catch {
      // Ignore security errors when accessing storage
    }

    // Add a small delay to ensure state is cleared
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill login form and submit
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Fill login form using environment variables
   * Assumes E2E_USERNAME and E2E_PASSWORD environment variables are set
   */
  async loginWithTestCredentials(): Promise<void> {
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set");
    }

    // Ensure we're on the login page before attempting login
    await this.page.waitForSelector('[data-testid="login-email-input"]', { timeout: 5000 });

    // Add a small delay to ensure the form is fully interactive
    await this.page.waitForTimeout(1000);

    await this.login(email, password);
  }

  /**
   * Wait for successful login redirect to dashboard
   */
  async waitForLoginSuccess(): Promise<void> {
    // Wait for navigation to complete and ensure we're on the dashboard
    await this.page.waitForURL("/", { timeout: 15000 });

    // Additional wait for the dashboard to fully load
    await this.page.waitForLoadState("networkidle", { timeout: 5000 });
  }

  /**
   * Check if login form is visible
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.emailInput.isVisible();
  }
}
