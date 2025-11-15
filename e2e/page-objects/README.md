# Page Object Model (POM) Classes

This directory contains Page Object Model classes for the ClassicInsights application, following Playwright E2E testing guidelines.

## Overview

Page Object Model is a design pattern that creates an abstraction layer between test code and page-specific code. Each page or component has its own class that encapsulates:

- Element locators using `data-testid` attributes
- Page-specific actions and interactions
- Assertions and verifications

## Classes

### LoginPage

Handles authentication functionality:

- `login(email, password)` - Fill and submit login form
- `loginWithTestCredentials()` - Login using environment variables
- `waitForLoginSuccess()` - Wait for successful login redirect

### DashboardPage

Handles main dashboard with notes list:

- `clickCreateNote()` - Navigate to note creation
- `getNoteItem(noteId)` - Get specific note item
- `hasNoteWithTitle(title)` - Check if note exists by title
- `getNotesCount()` - Get total number of notes

### NoteEditorPage

Handles note creation and editing:

- `createNote(title, content)` - Complete note creation workflow
- `fillNoteForm(title, content)` - Fill note form fields
- `saveNote()` - Click save and wait for completion
- `isSaveEnabled()` - Check if save button is enabled

## Usage Example

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, DashboardPage, NoteEditorPage } from "./page-objects";

test("create note workflow", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const noteEditorPage = new NoteEditorPage(page);

  // Generate dynamic title to avoid conflicts
  const timestamp = Date.now();
  const noteTitle = `Test Note - E2E ${timestamp}`;

  // Login
  await loginPage.goto();
  await loginPage.loginWithTestCredentials();
  await loginPage.waitForLoginSuccess();

  // Create note
  await dashboardPage.clickCreateNote();
  await noteEditorPage.createNote(noteTitle, "Test Content");
  await noteEditorPage.waitForSaveSuccess();

  // Verify
  await dashboardPage.waitForNotesToLoad();
  await expect(dashboardPage.hasNoteWithTitle(noteTitle)).toBeTruthy();
});
```

## Locator Strategy

All locators use `data-testid` attributes for resilient test selectors:

- `page.getByTestId('element-name')` - Preferred approach
- Avoid CSS selectors, XPath, or text-based locators when possible
- `data-testid` attributes are added to components specifically for testing

## Environment Variables

Tests expect the following environment variables (loaded from `.env.test`):

- `E2E_USERNAME` - Test user email
- `E2E_PASSWORD` - Test user password
- `BASE_URL` - Application base URL (defaults to http://localhost:4321)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key
- `OPENROUTER_API_KEY` - OpenRouter API key (for AI features)

## Best Practices

1. **Single Responsibility** - Each page object handles one page/component
2. **Resilient Selectors** - Use `data-testid` attributes over CSS selectors
3. **Descriptive Methods** - Method names should clearly indicate actions
4. **Wait Strategies** - Include appropriate waits for async operations
5. **Error Handling** - Tests should handle common failure scenarios
6. **Arrange-Act-Assert** - Follow structured test approach
7. **Dynamic Test Data** - Generate unique data (timestamps, random strings) to avoid conflicts
8. **Test Isolation** - Tests should not depend on data from other tests

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test create-note.spec.ts

# Run with UI mode
npx playwright test --ui

# Run with trace viewer
npx playwright test --trace on
```
