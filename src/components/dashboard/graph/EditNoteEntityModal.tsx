/**
 * EditNoteEntityModal component
 *
 * Modal for editing or deleting note-entity associations in the graph.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Enums } from "@/db/database.types";

interface EditNoteEntityModalProps {
  isOpen: boolean;
  noteId: string;
  entityId: string;
  noteName: string;
  entityName: string;
  currentType: Enums<"relationship_type">;
  onConfirm: (noteId: string, entityId: string, newType: Enums<"relationship_type">) => void;
  onCancel: () => void;
  onDelete: (noteId: string, entityId: string) => void;
}

const RELATIONSHIP_TYPES: {
  value: Enums<"relationship_type">;
  label: string;
  description: string;
}[] = [
  {
    value: "is_related_to",
    label: "Jest powiązane z",
    description: "Ogólne powiązanie",
  },
  {
    value: "is_example_of",
    label: "Jest przykładem",
    description: "Przykład konceptu",
  },
  {
    value: "criticizes",
    label: "Krytykuje",
    description: "Krytyka konceptu",
  },
  {
    value: "influenced_by",
    label: "Pod wpływem",
    description: "Wpływ konceptu",
  },
  {
    value: "expands_on",
    label: "Rozszerza",
    description: "Rozszerzenie konceptu",
  },
  {
    value: "is_student_of",
    label: "Jest uczniem",
    description: "Relacja uczeń-nauczyciel",
  },
];

export function EditNoteEntityModal({
  isOpen,
  noteId,
  entityId,
  noteName,
  entityName,
  currentType,
  onConfirm,
  onCancel,
  onDelete,
}: EditNoteEntityModalProps) {
  const [selectedType, setSelectedType] = useState<Enums<"relationship_type">>(currentType);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirm = () => {
    if (selectedType !== currentType) {
      onConfirm(noteId, entityId, selectedType);
    } else {
      onCancel();
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(noteId, entityId);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleCancel = () => {
    setShowDeleteConfirm(false);
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {showDeleteConfirm ? "Potwierdź usunięcie" : "Edytuj połączenie"}
          </DialogTitle>
          <DialogDescription>
            {showDeleteConfirm
              ? `Czy na pewno chcesz usunąć połączenie między "${noteName}" a "${entityName}"?`
              : `Edytuj typ połączenia między notatką "${noteName}" a encją "${entityName}"`}
          </DialogDescription>
        </DialogHeader>

        {!showDeleteConfirm && (
          <div className="py-4">
            <label htmlFor="relationship-type-select" className="mb-2 block text-sm font-medium">
              Typ relacji
            </label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as Enums<"relationship_type">)}
            >
              <SelectTrigger id="relationship-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {!showDeleteConfirm && (
              <Button variant="destructive" onClick={handleDelete}>
                Usuń połączenie
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Anuluj
            </Button>
            {showDeleteConfirm ? (
              <Button variant="destructive" onClick={handleDelete}>
                Tak, usuń
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={selectedType === currentType}>
                Zapisz zmiany
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
