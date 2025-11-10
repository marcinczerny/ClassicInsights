/**
 * NoteItem component
 *
 * Single item in the notes list. Displays title, modification date,
 * and is clickable to select as graph center.
 * Shows action buttons (Edit/Delete) when selected.
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { Eye, Trash2 } from "lucide-react";
import type { NoteDTO } from "@/types";

interface NoteItemProps {
  note: NoteDTO;
  isSelected?: boolean;
  onSelect: (noteId: string) => void;
  onDelete?: (noteId: string) => Promise<void>;
}

export function NoteItem({ note, isSelected = false, onSelect, onDelete }: NoteItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = new Date(note.updated_at).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(note.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onSelect if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button[data-action]') || target.closest('[role="dialog"]')) {
      return;
    }
    onSelect(note.id);
  };

  return (
    <>
      <Card
        className={`cursor-pointer transition-colors hover:bg-accent ${isSelected ? 'border-primary border-2' : ''}`}
        onClick={handleCardClick}
        data-testid={`note-item-${note.id}`}
      >
        <CardHeader className="p-4">
          <CardTitle className="text-base" data-testid="note-title">{note.title}</CardTitle>
          <CardDescription className="text-xs">
            Zaktualizowano: {formattedDate}
          </CardDescription>
          {note.entities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.entities.slice(0, 3).map((entity) => (
                <span
                  key={entity.id}
                  className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {entity.name}
                </span>
              ))}
              {note.entities.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  +{note.entities.length - 3}
                </span>
              )}
            </div>
          )}
        </CardHeader>

        {/* Action buttons for selected note */}
        {isSelected && (
          <CardFooter className="p-4 pt-0 flex gap-2">
            <Button
              data-action="view"
              variant="default"
              size="sm"
              className="flex-1"
              asChild
              data-testid="note-view-button"
            >
              <a href={`/notes/${note.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Podgląd
              </a>
            </Button>
            {onDelete && (
              <Button
                data-action="delete"
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                data-testid="note-delete-button"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              data-testid="note-delete-confirm-button"
            >
              {isDeleting ? "Usuwanie..." : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
