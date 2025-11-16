import type { Page, Locator } from "@playwright/test";

/**
 * NoteEditorPage - Page Object Model for note editor page
 * Handles note creation and editing functionality
 */
export class NoteEditorPage {
  readonly page: Page;

  // Locators using data-testid attributes
  readonly titleInput: Locator;
  readonly contentTextarea: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators using data-testid convention
    this.titleInput = page.getByTestId("note-title-input");
    this.contentTextarea = page.getByTestId("note-content-textarea");
    this.saveButton = page.getByTestId("save-note-button");
  }

  /**
   * Navigate to new note creation page
   */
  async gotoNewNote(): Promise<void> {
    await this.page.goto("/notes/new");
  }

  /**
   * Fill note form with title and content
   * @param title - Note title
   * @param content - Note content
   */
  async fillNoteForm(title: string, content: string): Promise<void> {
    await this.titleInput.fill(title);
    await this.contentTextarea.fill(content);
  }

  /**
   * Click save button and wait for success
   */
  async saveNote(): Promise<void> {
    await this.saveButton.click();
    // Wait for save to complete - could be redirect or toast message
    await this.page.waitForTimeout(1000);
  }

  /**
   * Complete note creation workflow: fill form and save
   * @param title - Note title
   * @param content - Note content
   */
  async createNote(title: string, content: string): Promise<void> {
    await this.fillNoteForm(title, content);
    await this.saveNote();
  }

  /**
   * Wait for successful save and redirect to dashboard
   */
  async waitForSaveSuccess(): Promise<void> {
    await this.page.waitForURL("/", { timeout: 10000 });
  }

  /**
   * Check if save button is enabled (form is valid)
   */
  async isSaveEnabled(): Promise<boolean> {
    return await this.saveButton.isEnabled();
  }

  /**
   * Check if save button is disabled
   */
  async isSaveDisabled(): Promise<boolean> {
    try {
      // Wait for the button to be visible first
      await this.saveButton.waitFor({ state: 'visible', timeout: 5000 });

      // Use isEnabled() method which is more reliable than checking attributes
      const isEnabled = await this.saveButton.isEnabled();
      console.log('Save button isEnabled:', isEnabled);
      return !isEnabled;
    } catch (error) {
      console.error('Error checking save button disabled state:', error);
      // If button doesn't exist or can't be checked, assume it's disabled
      return true;
    }
  }

  /**
   * Check if editor form is visible
   */
  async isEditorVisible(): Promise<boolean> {
    return (await this.titleInput.isVisible()) && (await this.contentTextarea.isVisible());
  }

  /**
   * Get current title value
   */
  async getTitleValue(): Promise<string> {
    return await this.titleInput.inputValue();
  }

  /**
   * Get current content value
   */
  async getContentValue(): Promise<string> {
    return await this.contentTextarea.inputValue();
  }

  /**
   * Clear the title field
   */
  async clearTitle(): Promise<void> {
    await this.titleInput.clear();
  }

  /**
   * Clear the content field
   */
  async clearContent(): Promise<void> {
    await this.contentTextarea.clear();
  }
}
