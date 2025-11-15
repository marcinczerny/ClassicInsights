/**
 * NoteForm component
 *
 * Form containing the basic fields for editing a note: title and content.
 * Includes validation and propagates changes to parent component.
 */

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EntityTagInput } from "./EntityTagInput";
import type { NoteViewModel, NoteEntityViewModel } from "./types";

interface NoteFormProps {
  note: NoteViewModel;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onEntitiesChange: (entities: NoteEntityViewModel[]) => void;
}

export function NoteForm({
  note,
  onTitleChange,
  onContentChange,
  onEntitiesChange,
}: NoteFormProps) {
  // Validation state
  const titleError = !note.title.trim()
    ? "Tytuł jest wymagany"
    : note.title.length > 255
      ? "Tytuł nie może przekraczać 255 znaków"
      : null;
  const contentError =
    note.content.length > 10000 ? "Treść nie może przekraczać 10 000 znaków" : null;

  return (
    <div className="space-y-6">
      {/* Title field */}
      <div className="space-y-2">
        <Label htmlFor="note-title">
          Tytuł <span className="text-destructive">*</span>
        </Label>
        <Input
          id="note-title"
          placeholder="Tytuł notatki"
          value={note.title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={255}
          className={titleError ? "border-destructive" : ""}
          data-testid="note-title-input"
        />
        {titleError && <p className="text-xs text-destructive">{titleError}</p>}
      </div>

      {/* Content field */}
      <div className="space-y-2">
        <Label htmlFor="note-content">Treść</Label>
        <Textarea
          id="note-content"
          placeholder="Treść notatki w formacie Markdown"
          value={note.content}
          onChange={(e) => onContentChange(e.target.value)}
          maxLength={10000}
          rows={12}
          className={contentError ? "border-destructive" : ""}
          data-testid="note-content-textarea"
        />
        <div className="flex justify-between items-center">
          <div>{contentError && <p className="text-xs text-destructive">{contentError}</p>}</div>
          <p className="text-xs text-muted-foreground">{note.content.length} / 10 000 znaków</p>
        </div>
      </div>

      {/* Entity tags */}
      <EntityTagInput entities={note.entities} onEntitiesChange={onEntitiesChange} />
    </div>
  );
}
