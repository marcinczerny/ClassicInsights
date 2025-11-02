/**
 * NoteItem component
 *
 * Single item in the notes list. Displays title, modification date,
 * and is clickable to select as graph center.
 */

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { NoteDTO } from "@/types";

interface NoteItemProps {
  note: NoteDTO;
  isSelected?: boolean;
  onSelect: (noteId: string) => void;
}

export function NoteItem({ note, isSelected = false, onSelect }: NoteItemProps) {
  const formattedDate = new Date(note.updated_at).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <button
      onClick={() => onSelect(note.id)}
      className="block w-full text-left no-underline"
    >
      <Card className={`cursor-pointer transition-colors hover:bg-accent ${isSelected ? 'border-primary border-2' : ''}`}>
        <CardHeader className="p-4">
          <CardTitle className="text-base">{note.title}</CardTitle>
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
      </Card>
    </button>
  );
}
