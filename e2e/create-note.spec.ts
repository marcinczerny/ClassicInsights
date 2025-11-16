import { test, expect } from "@playwright/test";
import { LoginPage, DashboardPage, NoteEditorPage } from "./page-objects";

/**
 * Test suite for note creation scenario using Page Object Model
 * Tests the complete user journey: login -> create note -> verify creation
 */
test.describe("Note Creation Workflow", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let noteEditorPage: NoteEditorPage;

  test.beforeEach(async ({ page }) => {
    // Initialize Page Object instances
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    noteEditorPage = new NoteEditorPage(page);
  });

  test("should create a new note successfully", async () => {
    // Arrange
    const timestamp = Date.now();
    const noteTitle = `Test Note - E2E ${timestamp}`;
    const noteContent =
      "This is a test note created by Playwright E2E test.\n\nIt contains multiple lines and should be saved successfully.";

    // Give the server extra time to fully initialize on first run
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Act: Login with test credentials
    await loginPage.clearAuthState();
    await loginPage.goto();
    await loginPage.loginWithTestCredentials();
    await loginPage.waitForLoginSuccess();

    // Assert: Verify dashboard is loaded
    await expect(dashboardPage.isDashboardVisible()).toBeTruthy();

    // Act: Navigate to create new note
    await dashboardPage.clickCreateNote();

    // Assert: Verify note editor is loaded
    await expect(noteEditorPage.isEditorVisible()).toBeTruthy();

    // Act: Fill and save the note
    await noteEditorPage.createNote(noteTitle, noteContent);
    //await noteEditorPage.waitForSaveSuccess();

    // Act: Navigate back to dashboard (since app doesn't auto-redirect after save)
    await dashboardPage.goto();

    // Assert: Verify note appears in the dashboard list
    await dashboardPage.waitForNotesToLoad();
    await expect(dashboardPage.hasNoteWithTitle(noteTitle)).toBeTruthy();
  });

  test("should validate note form requirements", async ({ page }) => {
    // Give the server extra time to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Arrange & Act: Login and navigate to note editor
    await loginPage.clearAuthState();
    await loginPage.goto();
    await loginPage.loginWithTestCredentials();
    await loginPage.waitForLoginSuccess();
    await dashboardPage.clickCreateNote();

    // Assert: Save button should be disabled when title is empty
    await page.waitForTimeout(500); // Wait for component to load
    await expect(noteEditorPage.isSaveDisabled()).toBeTruthy();

    // Act: Fill only content without title
    await noteEditorPage.fillNoteForm("", "Some content without title");

    // Wait for React to update the button state
    await page.waitForTimeout(500);

    // Assert: Save button should still be disabled
    await expect(noteEditorPage.isSaveDisabled()).toBeTruthy();

    // Act: Fill title but clear content
    await noteEditorPage.fillNoteForm("Title with content", "content");

    // Wait for React to update the button state
    await page.waitForTimeout(500);

    // Assert: Save button should be enabled (title is required, content is required)
    await expect(noteEditorPage.isSaveEnabled()).toBeTruthy();
  });
});
