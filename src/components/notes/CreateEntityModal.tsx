/**
 * CreateEntityModal component
 *
 * Modal for creating a new entity without leaving the editor view.
 * Includes validation and error handling.
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateEntityCommand, EntityDTO } from "@/types";
import type { Enums } from "@/db/database.types";

interface CreateEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: CreateEntityCommand) => Promise<EntityDTO>;
}

const ENTITY_TYPES: { value: Enums<"entity_type">; label: string }[] = [
  { value: "person", label: "Osoba" },
  { value: "work", label: "Dzieło" },
  { value: "epoch", label: "Epoka" },
  { value: "idea", label: "Idea" },
  { value: "school", label: "Szkoła" },
  { value: "system", label: "System" },
  { value: "other", label: "Inne" },
];

export function CreateEntityModal({ isOpen, onClose, onSave }: CreateEntityModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Enums<"entity_type"> | "">("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    type?: string;
    description?: string;
  }>({});

  const resetForm = () => {
    setName("");
    setType("");
    setDescription("");
    setError(null);
    setValidationErrors({});
  };

  const handleClose = () => {
    if (isSaving) return;
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!name.trim()) {
      errors.name = "Nazwa jest wymagana";
    } else if (name.length > 100) {
      errors.name = "Nazwa nie może przekraczać 100 znaków";
    }

    if (!type) {
      errors.type = "Typ jest wymagany";
    }

    if (description.length > 1000) {
      errors.description = "Opis nie może przekraczać 1000 znaków";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!type) return;

    setIsSaving(true);
    setError(null);

    try {
      const command: CreateEntityCommand = {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
      };

      await onSave(command);
      resetForm();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        // Handle 409 Conflict (duplicate name)
        if (err.message.includes("409") || err.message.toLowerCase().includes("already exists")) {
          setError("Byt o tej nazwie już istnieje");
        } else {
          setError(err.message || "Nie udało się utworzyć bytu");
        }
      } else {
        setError("Wystąpił nieoczekiwany błąd");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = name.trim() && type;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Utwórz nowy byt</DialogTitle>
          <DialogDescription>Dodaj nowy byt do swojej bazy wiedzy</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name field */}
          <div className="space-y-2">
            <label htmlFor="entity-name" className="text-sm font-medium leading-none">
              Nazwa <span className="text-destructive">*</span>
            </label>
            <Input
              id="entity-name"
              placeholder="Nazwa bytu"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationErrors((prev) => ({ ...prev, name: undefined }));
              }}
              maxLength={100}
              disabled={isSaving}
            />
            {validationErrors.name && <p className="text-xs text-destructive">{validationErrors.name}</p>}
          </div>

          {/* Type field */}
          <div className="space-y-2">
            <label htmlFor="entity-type" className="text-sm font-medium leading-none">
              Typ <span className="text-destructive">*</span>
            </label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as Enums<"entity_type">);
                setValidationErrors((prev) => ({ ...prev, type: undefined }));
              }}
              disabled={isSaving}
            >
              <SelectTrigger id="entity-type">
                <SelectValue placeholder="Wybierz typ" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((entityType) => (
                  <SelectItem key={entityType.value} value={entityType.value}>
                    {entityType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.type && <p className="text-xs text-destructive">{validationErrors.type}</p>}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <label htmlFor="entity-description" className="text-sm font-medium leading-none">
              Opis
            </label>
            <Textarea
              id="entity-description"
              placeholder="Opcjonalny opis bytu"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setValidationErrors((prev) => ({ ...prev, description: undefined }));
              }}
              maxLength={1000}
              rows={4}
              disabled={isSaving}
            />
            {validationErrors.description && <p className="text-xs text-destructive">{validationErrors.description}</p>}
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
            {isSaving ? "Tworzenie..." : "Utwórz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
