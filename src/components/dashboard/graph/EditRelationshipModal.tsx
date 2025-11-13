/**
 * EditRelationshipModal component
 *
 * Modal for editing the type of an existing relationship between two entities.
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Enums } from "@/db/database.types";

interface EditRelationshipModalProps {
  isOpen: boolean;
  relationshipId: string;
  sourceEntityName: string;
  targetEntityName: string;
  currentType: Enums<"relationship_type">;
  onConfirm: (relationshipId: string, type: Enums<"relationship_type">) => void;
  onCancel: () => void;
  onDelete: (relationshipId: string) => void;
}

const RELATIONSHIP_TYPES: {
  value: Enums<"relationship_type">;
  label: string;
  description: string;
}[] = [
  {
    value: "is_related_to",
    label: "Jest powiązane z",
    description: "Ogólne powiązanie między bytami",
  },
  {
    value: "is_example_of",
    label: "Jest przykładem",
    description: "Relacja instancja-kategoria",
  },
  {
    value: "criticizes",
    label: "Krytykuje",
    description: "Relacja krytyki",
  },
  {
    value: "influenced_by",
    label: "Pod wpływem",
    description: "Relacja wpływu",
  },
  {
    value: "expands_on",
    label: "Rozszerza",
    description: "Relacja rozszerzenia",
  },
  {
    value: "is_student_of",
    label: "Jest uczniem",
    description: "Relacja uczeń-nauczyciel",
  },
];

export function EditRelationshipModal({
  isOpen,
  relationshipId,
  sourceEntityName,
  targetEntityName,
  currentType,
  onConfirm,
  onCancel,
  onDelete,
}: EditRelationshipModalProps) {
  const [selectedType, setSelectedType] = useState<Enums<"relationship_type">>(currentType);

  const handleConfirm = () => {
    onConfirm(relationshipId, selectedType);
  };

  const handleDelete = () => {
    if (confirm("Czy na pewno chcesz usunąć tę relację?")) {
      onDelete(relationshipId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj relację</DialogTitle>
          <DialogDescription>
            Zmień typ relacji między bytami &quot;{sourceEntityName}&quot; i &quot;{targetEntityName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label htmlFor="edit-relationship-type-select" className="mb-2 block text-sm font-medium">
            Typ relacji
          </label>
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as Enums<"relationship_type">)}>
            <SelectTrigger id="edit-relationship-type-select">
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

        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Usuń relację
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Anuluj
            </Button>
            <Button onClick={handleConfirm} disabled={selectedType === currentType}>
              Zapisz zmiany
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
