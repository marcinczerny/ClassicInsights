/**
 * NotesList component
 *
 * Displays a list of notes or an empty state if the user has no notes
 * or search results are empty. Also contains pagination controls.
 */

import { NoteItem } from "./NoteItem";
import { PaginationControls } from "./PaginationControls";
import { Skeleton } from "@/components/ui/skeleton";
import type { NoteDTO, PaginationDTO } from "@/types";

interface NotesListProps {
  notes: NoteDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  selectedNoteId?: string;
  onPageChange: (page: number) => void;
  onNoteSelect: (noteId: string) => void;
  onNoteDelete?: (noteId: string) => Promise<void>;
}

/**
 * Skeleton loader for notes list
 */
function NotesListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-lg border p-4">
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="mb-3 h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no notes found
 */
function EmptyState({ hasSearchTerm }: { hasSearchTerm: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-2 text-4xl">📝</div>
      <h3 className="mb-1 font-semibold">{hasSearchTerm ? "Brak wyników" : "Brak notatek"}</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {hasSearchTerm ? "Spróbuj zmienić kryteria wyszukiwania" : "Zacznij od utworzenia pierwszej notatki"}
      </p>
      {!hasSearchTerm && (
        <a
          href="/notes/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Utwórz notatkę
        </a>
      )}
    </div>
  );
}

export function NotesList({
  notes,
  pagination,
  isLoading,
  selectedNoteId,
  onPageChange,
  onNoteSelect,
  onNoteDelete,
}: NotesListProps) {
  if (isLoading) {
    return <NotesListSkeleton />;
  }

  if (notes.length === 0) {
    return <EmptyState hasSearchTerm={false} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-auto notes-list-scroll">
        {notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            isSelected={note.id === selectedNoteId}
            onSelect={onNoteSelect}
            onDelete={onNoteDelete}
          />
        ))}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <PaginationControls pagination={pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}
