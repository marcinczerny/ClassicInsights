import type { Page, Locator } from '@playwright/test';

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
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/login');
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
      throw new Error('E2E_USERNAME and E2E_PASSWORD environment variables must be set');
    }

    await this.login(email, password);
  }

  /**
   * Wait for successful login redirect to dashboard
   */
  async waitForLoginSuccess(): Promise<void> {
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  /**
   * Check if login form is visible
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.emailInput.isVisible();
  }
}
