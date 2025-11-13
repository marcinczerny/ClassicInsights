import type { Page, Locator } from "@playwright/test";

/**
 * DashboardPage - Page Object Model for dashboard page
 * Handles notes list, search, and navigation functionality
 */
export class DashboardPage {
  readonly page: Page;

  // Locators using data-testid attributes
  readonly createNoteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators using data-testid convention
    this.createNoteButton = page.getByTestId("create-note-button");
  }

  /**
   * Navigate to dashboard page
   */
  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  /**
   * Click create new note button and wait for navigation
   */
  async clickCreateNote(): Promise<void> {
    await this.createNoteButton.click();
    await this.page.waitForURL("/notes/new", { timeout: 5000 });
  }

  /**
   * Get note item by ID from the notes list
   * @param noteId - Note ID
   */
  getNoteItem(noteId: string): Locator {
    return this.page.getByTestId(`note-item-${noteId}`);
  }

  /**
   * Get all note items in the list
   */
  getAllNoteItems(): Locator {
    return this.page.locator('[data-testid^="note-item-"]');
  }

  /**
   * Get note title within a note item
   * @param noteItem - Note item locator
   */
  getNoteTitle(noteItem: Locator): Locator {
    return noteItem.getByTestId("note-title");
  }

  /**
   * Check if note with specific title exists in the list
   * @param title - Note title to search for
   */
  async hasNoteWithTitle(title: string): Promise<boolean> {
    const noteTitles = this.page.getByTestId("note-title");
    const count = await noteTitles.filter({ hasText: title }).count();
    return count > 0;
  }

  /**
   * Wait for notes to load (useful after creating a note)
   */
  async waitForNotesToLoad(): Promise<void> {
    await this.page.waitForSelector('[data-testid^="note-item-"]', { timeout: 5000 });
  }

  /**
   * Get the count of notes in the list
   */
  async getNotesCount(): Promise<number> {
    return await this.getAllNoteItems().count();
  }

  /**
   * Click on a specific note item
   * @param noteId - Note ID to click
   */
  async clickNoteItem(noteId: string): Promise<void> {
    await this.getNoteItem(noteId).click();
  }

  /**
   * Check if dashboard is loaded and visible
   */
  async isDashboardVisible(): Promise<boolean> {
    return await this.createNoteButton.isVisible();
  }
}
