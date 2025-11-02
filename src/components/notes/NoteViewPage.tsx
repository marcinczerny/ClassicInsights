/**
 * NoteViewPage component
 *
 * Read-only view of a note with rendered Markdown content.
 * Displays title, content, entities, and action buttons (Edit/Delete).
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { NoteDTO } from "@/types";

interface NoteViewPageProps {
  noteId: string;
}

export function NoteViewPage({ noteId }: NoteViewPageProps) {
  const [note, setNote] = useState<NoteDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Fetch note from API
   */
  useEffect(() => {
    const fetchNote = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/notes/${noteId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Note not found");
          }
          throw new Error("Failed to fetch note");
        }

        const data: NoteDTO = await response.json();
        setNote(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  /**
   * Handle delete action
   */
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      toast.success("Notatka została usunięta");
      // Redirect to home after deletion
      window.location.href = "/";
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message || "Nie udało się usunąć notatki");
      }
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
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

  const formattedDate = new Date(note.updated_at).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <a href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót
            </a>
          </Button>

          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setShowDeleteConfirmation(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń
            </Button>

            <Button asChild>
              <a href={`/notes/${noteId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edytuj
              </a>
            </Button>
          </div>
        </div>

        {/* Note content card */}
        <div className="bg-card rounded-lg border p-8 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold mb-2">{note.title}</h1>
            <p className="text-sm text-muted-foreground">
              Zaktualizowano: {formattedDate}
            </p>
          </div>

          {/* Entities */}
          {note.entities.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
                Powiązane byty
              </h2>
              <div className="flex flex-wrap gap-2">
                {note.entities.map((entity) => (
                  <Badge key={entity.id} variant="secondary" className="text-sm">
                    {entity.name}
                    {entity.relationship_type && (
                      <span className="ml-1 text-xs opacity-70">
                        ({entity.relationship_type})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t"></div>

          {/* Markdown content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {note.content ? (
              <ReactMarkdown>{note.content}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">Brak treści</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tę notatkę?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Notatka "{note.title}" zostanie trwale usunięta z bazy danych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
