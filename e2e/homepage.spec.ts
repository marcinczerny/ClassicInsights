import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Check if the page loaded
    await expect(page).toHaveTitle(/ClassicInsights/);

    // Check for main content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Check for navigation bar or header
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});
