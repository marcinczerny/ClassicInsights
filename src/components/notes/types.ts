/**
 * Type definitions for Note Editor View
 *
 * ViewModels extend DTOs with UI-specific state and structure
 */

import type { SuggestionDTO } from "@/types";
import type { Enums } from "@/db/database.types";

/**
 * ViewModel for a note in the editor. Stores the current form state.
 */
export interface NoteViewModel {
  id: string | "new"; // 'new' for newly created notes
  title: string;
  content: string;
  entities: NoteEntityViewModel[];
}

/**
 * ViewModel for an entity associated with a note.
 * Structurally similar to NoteEntityDTO, but used in client state.
 */
export interface NoteEntityViewModel {
  id: string; // Entity ID
  name: string;
  type: Enums<"entity_type">;
  relationship_type: Enums<"relationship_type">;
}

/**
 * ViewModel for AI suggestion. Extends DTO with loading state for actions.
 */
export interface SuggestionViewModel extends SuggestionDTO {
  isSubmitting: boolean; // Loading state during accept/reject
}

/**
 * State interface for the note editor hook
 */
export interface NoteEditorState {
  note: NoteViewModel | null;
  suggestions: SuggestionViewModel[];
  isLoadingNote: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isAnalyzing: boolean;
  error: Error | null;
  isDirty: boolean;
}
