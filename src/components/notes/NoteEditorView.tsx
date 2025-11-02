/**
 * NoteEditorView component
 *
 * Main container component for the Note Editor view.
 * Manages state, data fetching, and coordinates user actions.
 * Renders note form, AI suggestions panel, and action buttons.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NoteForm } from "./NoteForm";
import { AISuggestionsPanel } from "./AISuggestionsPanel";
import { useNoteEditor } from "./hooks/useNoteEditor";
import { toast } from "sonner";

interface NoteEditorViewProps {
  noteId: string | 'new';
}

export function NoteEditorView({ noteId }: NoteEditorViewProps) {
  const {
    note,
    suggestions,
    isLoadingNote,
    isSaving,
    isDeleting,
    isAnalyzing,
    error,
    isDirty,
    setNoteField,
    setNoteEntities,
    saveNote,
    deleteNote,
    runAnalysis,
    acceptSuggestion,
    rejectSuggestion,
  } = useNoteEditor(noteId);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  /**
   * Handle save action with toast notifications
   */
  const handleSave = async () => {
    try {
      await saveNote();
      toast.success("Notatka została zapisana");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Nie udało się zapisać notatki");
      }
    }
  };

  /**
   * Handle delete action with confirmation
   */
  const handleDeleteConfirm = async () => {
    try {
      await deleteNote();
      toast.success("Notatka została usunięta");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Nie udało się usunąć notatki");
      }
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  /**
   * Handle AI analysis with toast notifications
   */
  const handleAnalyze = async () => {
    try {
      await runAnalysis();
      toast.success("Analiza zakończona");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Nie udało się przeanalizować notatki");
      }
    }
  };

  /**
   * Handle suggestion acceptance with toast notifications
   */
  const handleAcceptSuggestion = async (suggestionId: string) => {
    try {
      await acceptSuggestion(suggestionId);
      toast.success("Sugestia zaakceptowana");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Nie udało się zaakceptować sugestii");
      }
    }
  };

  /**
   * Handle suggestion rejection
   */
  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      await rejectSuggestion(suggestionId);
      toast.info("Sugestia odrzucona");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Nie udało się odrzucić sugestii");
      }
    }
  };

  // Loading state
  if (isLoadingNote) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Ładowanie notatki...</p>
        </div>
      </div>
    );
  }

  // Error state (404 Not Found)
  if (error && error.message === "Note not found") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Notatka nie została znaleziona</h1>
          <p className="text-muted-foreground">
            Notatka, której szukasz, nie istnieje lub została usunięta.
          </p>
          <Button asChild>
            <a href="/">Powrót do listy notatek</a>
          </Button>
        </div>
      </div>
    );
  }

  // Note not loaded yet
  if (!note) {
    return null;
  }

  // Validation for save button
  const isSaveDisabled = !isDirty || !note.title.trim() || isSaving;

  // Validation for analyze button
  const isAnalyzeDisabled =
    note.id === 'new' ||
    !note.content.trim() ||
    note.content.length < 10;

  const analyzeDisabledReason =
    note.id === 'new'
      ? "Zapisz notatkę, aby móc wygenerować sugestie"
      : !note.content.trim() || note.content.length < 10
      ? "Treść notatki jest zbyt krótka (minimum 10 znaków)"
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {note.id === 'new' ? 'Nowa notatka' : 'Edycja notatki'}
          </h1>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (note.id === 'new') {
                  window.location.href = '/';
                } else {
                  window.location.href = `/notes/${note.id}`;
                }
              }}
            >
              Anuluj
            </Button>

            {note.id !== 'new' && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirmation(true)}
                disabled={isDeleting}
              >
                {isDeleting ? "Usuwanie..." : "Usuń"}
              </Button>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              {isSaving ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </div>
        </div>

        {/* Main content - two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Note form - left side (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border p-6">
              <NoteForm
                note={note}
                onTitleChange={(title) => setNoteField('title', title)}
                onContentChange={(content) => setNoteField('content', content)}
                onEntitiesChange={setNoteEntities}
              />
            </div>
          </div>

          {/* AI Suggestions panel - right side (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-6 sticky top-8">
              <AISuggestionsPanel
                noteId={note.id}
                suggestions={suggestions}
                isAnalyzing={isAnalyzing}
                isAnalyzeDisabled={isAnalyzeDisabled}
                analyzeDisabledReason={analyzeDisabledReason}
                onAnalyze={handleAnalyze}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tę notatkę?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Notatka zostanie trwale usunięta z bazy danych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Usuwanie..." : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
