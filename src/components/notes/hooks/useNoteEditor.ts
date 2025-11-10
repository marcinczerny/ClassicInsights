/**
 * Custom hook for managing Note Editor state and interactions
 *
 * Encapsulates all state management, data fetching, and side effects logic
 * for the Note Editor view, keeping components clean and logic reusable.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { NoteViewModel, NoteEntityViewModel, SuggestionViewModel, NoteEditorState } from "../types";
import type { NoteDTO, CreateNoteCommand, UpdateNoteCommand, EntityDTO } from "@/types";

const INITIAL_STATE: NoteEditorState = {
  note: null,
  suggestions: [],
  isLoadingNote: false,
  isSaving: false,
  isDeleting: false,
  isAnalyzing: false,
  error: null,
  isDirty: false,
};

export function useNoteEditor(noteId: string | 'new') {
  const [state, setState] = useState<NoteEditorState>(INITIAL_STATE);
  const initialNoteRef = useRef<NoteViewModel | null>(null);

  /**
   * Converts NoteDTO to NoteViewModel
   */
  const dtoToViewModel = useCallback((dto: NoteDTO): NoteViewModel => {
    return {
      id: dto.id,
      title: dto.title,
      content: dto.content || '',
      entities: dto.entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        relationship_type: entity.relationship_type || 'is_related_to',
      })),
    };
  }, []);

  /**
   * Fetch note from API
   */
  const fetchNote = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoadingNote: true, error: null }));

    try {
      const response = await fetch(`/api/notes/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Note not found");
        }
        throw new Error("Failed to fetch note");
      }

      const dto: NoteDTO = await response.json();
      const viewModel = dtoToViewModel(dto);

      initialNoteRef.current = viewModel;
      setState((prev) => ({
        ...prev,
        note: viewModel,
        isLoadingNote: false,
        isDirty: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoadingNote: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
    }
  }, [dtoToViewModel]);

  /**
   * Fetch suggestions for note
   */
  const fetchSuggestions = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notes/${id}/suggestions?status=pending`);

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const result = await response.json();
      const suggestions: SuggestionViewModel[] = Array.isArray(result) ? result.map((dto: any) => ({
        ...dto,
        isSubmitting: false,
      })) : [];

      setState((prev) => ({ ...prev, suggestions }));
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  }, []);

  /**
   * Initialize note - fetch existing or create empty
   */
  useEffect(() => {
    if (noteId === 'new') {
      const emptyNote: NoteViewModel = {
        id: 'new',
        title: '',
        content: '',
        entities: [],
      };
      initialNoteRef.current = emptyNote;
      setState((prev) => ({
        ...prev,
        note: emptyNote,
        isLoadingNote: false,
        isDirty: false,
      }));
    } else {
      fetchNote(noteId);
      fetchSuggestions(noteId);
    }
  }, [noteId, fetchNote, fetchSuggestions]);

  /**
   * Update a field in the note
   */
  const setNoteField = useCallback((field: 'title' | 'content', value: string) => {
    setState((prev) => {
      if (!prev.note) return prev;

      const updatedNote = { ...prev.note, [field]: value };
      const isDirty = JSON.stringify(updatedNote) !== JSON.stringify(initialNoteRef.current);

      return {
        ...prev,
        note: updatedNote,
        isDirty,
      };
    });
  }, []);

  /**
   * Update entities list
   */
  const setNoteEntities = useCallback((entities: NoteEntityViewModel[]) => {
    setState((prev) => {
      if (!prev.note) return prev;

      const updatedNote = { ...prev.note, entities };
      const isDirty = JSON.stringify(updatedNote) !== JSON.stringify(initialNoteRef.current);

      return {
        ...prev,
        note: updatedNote,
        isDirty,
      };
    });
  }, []);

  /**
   * Save note (create or update)
   */
  const saveNote = useCallback(async () => {
    if (!state.note) return;
    if (!state.isDirty) return;
    if (!state.note.title.trim()) return;

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const isNew = state.note.id === 'new';
      const url = isNew ? '/api/notes' : `/api/notes/${state.note.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const command: CreateNoteCommand | UpdateNoteCommand = {
        title: state.note.title,
        content: state.note.content,
        entities: state.note.entities.map(entity => ({
          entity_id: entity.id,
          relationship_type: entity.relationship_type,
        })),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to save note");
      }

      const savedNote: NoteDTO = await response.json();
      const viewModel = dtoToViewModel(savedNote);

      initialNoteRef.current = viewModel;
      setState((prev) => ({
        ...prev,
        note: viewModel,
        isSaving: false,
        isDirty: false,
      }));

      // If note was newly created, redirect to edit mode
      if (isNew) {
        window.location.href = `/notes/${savedNote.id}`;
      }

      return savedNote;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
      throw error;
    }
  }, [state.note, state.isDirty, dtoToViewModel]);

  /**
   * Delete note
   */
  const deleteNote = useCallback(async () => {
    if (!state.note || state.note.id === 'new') return;

    setState((prev) => ({ ...prev, isDeleting: true, error: null }));

    try {
      const response = await fetch(`/api/notes/${state.note.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      // Redirect to home/notes list after deletion
      window.location.href = '/';
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isDeleting: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
      throw error;
    }
  }, [state.note]);

  /**
   * Run AI analysis on note
   */
  const runAnalysis = useCallback(async () => {
    if (!state.note || state.note.id === 'new') return;
    if (!state.note.content.trim() || state.note.content.length < 10) return;

    setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const response = await fetch(`/api/notes/${state.note.id}/analyze`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to analyze note");
      }

      const result = await response.json();
      const suggestions: SuggestionViewModel[] = result.suggestions.map((dto: any) => ({
        ...dto,
        isSubmitting: false,
      }));

      setState((prev) => ({
        ...prev,
        suggestions,
        isAnalyzing: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
      throw error;
    }
  }, [state.note]);

  /**
   * Accept AI suggestion
   */
  const acceptSuggestion = useCallback(async (suggestionId: string) => {
    // Mark suggestion as submitting
    setState((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map(s =>
        s.id === suggestionId ? { ...s, isSubmitting: true } : s
      ),
    }));

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept suggestion");
      }

      // Remove suggestion from list
      setState((prev) => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
      }));

      // Refresh note data if suggestion added entity
      if (state.note && state.note.id !== 'new') {
        await fetchNote(state.note.id);
      }
    } catch (error) {
      // Reset submitting state on error
      setState((prev) => ({
        ...prev,
        suggestions: prev.suggestions.map(s =>
          s.id === suggestionId ? { ...s, isSubmitting: false } : s
        ),
      }));
      throw error;
    }
  }, [state.note, fetchNote]);

  /**
   * Reject AI suggestion
   */
  const rejectSuggestion = useCallback(async (suggestionId: string) => {
    // Mark suggestion as submitting
    setState((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map(s =>
        s.id === suggestionId ? { ...s, isSubmitting: true } : s
      ),
    }));

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject suggestion");
      }

      // Remove suggestion from list
      setState((prev) => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
      }));
    } catch (error) {
      // Reset submitting state on error
      setState((prev) => ({
        ...prev,
        suggestions: prev.suggestions.map(s =>
          s.id === suggestionId ? { ...s, isSubmitting: false } : s
        ),
      }));
      throw error;
    }
  }, []);

  return {
    // State
    note: state.note,
    suggestions: state.suggestions,
    isLoadingNote: state.isLoadingNote,
    isSaving: state.isSaving,
    isDeleting: state.isDeleting,
    isAnalyzing: state.isAnalyzing,
    error: state.error,
    isDirty: state.isDirty,

    // Actions
    setNoteField,
    setNoteEntities,
    saveNote,
    deleteNote,
    runAnalysis,
    acceptSuggestion,
    rejectSuggestion,
  };
}
