/**
 * NotesPanel component
 *
 * Side panel containing all note-related elements:
 * - SearchBar for filtering notes
 * - Button to create new note
 * - NotesList with pagination
 */

import { SearchBar } from "./SearchBar";
import { NotesList } from "./NotesList";
import { Button } from "@/components/ui/button";
import type { NoteDTO, PaginationDTO } from "@/types";

interface NotesPanelProps {
  notes: NoteDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  selectedNoteId?: string;
  onSearchChange: (term: string) => void;
  onPageChange: (page: number) => void;
  onNoteSelect: (noteId: string) => void;
}

export function NotesPanel({
  notes,
  pagination,
  isLoading,
  error,
  searchTerm,
  selectedNoteId,
  onSearchChange,
  onPageChange,
  onNoteSelect,
}: NotesPanelProps) {
  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Header with title */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Notatki</h2>
      </div>

      {/* Search bar */}
      <div className="border-b p-4">
        <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
      </div>

      {/* New note button */}
      <div className="border-b p-4">
        <Button asChild className="w-full">
          <a href="/notes/new">+ Nowa notatka</a>
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="mb-2 text-destructive">Błąd ładowania notatek</div>
          <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Spróbuj ponownie
          </Button>
        </div>
      )}

      {/* Notes list */}
      {!error && (
        <div className="flex-1 overflow-hidden p-4">
          <NotesList
            notes={notes}
            pagination={pagination}
            isLoading={isLoading}
            selectedNoteId={selectedNoteId}
            onPageChange={onPageChange}
            onNoteSelect={onNoteSelect}
          />
        </div>
      )}
    </div>
  );
}
