import { useEffect, useMemo, useState } from "react";
import type { JSX, FormEvent } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { entityTypes } from "@/lib/validation";
import type { CreateEntityCommand, EntityWithCountDTO, UpdateEntityCommand } from "@/types";

interface EntityFormModalProps {
  isOpen: boolean;
  entityToEdit: EntityWithCountDTO | null;
  isSubmitting: boolean;
  onSubmit: (data: CreateEntityCommand | UpdateEntityCommand) => Promise<void>;
  onClose: () => void;
}

interface FormErrors {
  name?: string;
  description?: string;
}

const DEFAULT_ENTITY_TYPE = entityTypes[0] ?? "person";

export function EntityFormModal({
  isOpen,
  entityToEdit,
  isSubmitting,
  onSubmit,
  onClose,
}: EntityFormModalProps): JSX.Element {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(DEFAULT_ENTITY_TYPE);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      setName(entityToEdit?.name ?? "");
      setType(entityToEdit?.type ?? DEFAULT_ENTITY_TYPE);
      setDescription(entityToEdit?.description ?? "");
      setErrors({});
    }
  }, [entityToEdit, isOpen]);

  const mode = entityToEdit ? "edit" : "create";

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) {
      return true;
    }
    return name.trim().length === 0 || name.trim().length > 100 || description.trim().length > 1000;
  }, [description, isSubmitting, name]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    const nextErrors: FormErrors = {};

    if (!trimmedName) {
      nextErrors.name = "Nazwa jest wymagana.";
    } else if (trimmedName.length > 100) {
      nextErrors.name = "Nazwa nie może przekraczać 100 znaków.";
    }

    if (trimmedDescription.length > 1000) {
      nextErrors.description = "Opis nie może przekraczać 1000 znaków.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      name: trimmedName,
      type: type as CreateEntityCommand["type"],
      description: trimmedDescription ? trimmedDescription : undefined,
    };

    if (mode === "edit") {
      await onSubmit(payload as UpdateEntityCommand);
    } else {
      await onSubmit(payload);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edytuj byt" : "Dodaj nowy byt"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="entity-name">Nazwa</Label>
            <Input
              id="entity-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="np. Immanuel Kant"
              maxLength={100}
              required
              autoFocus
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "entity-name-error" : undefined}
            />
            {errors.name && (
              <p id="entity-name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-type">Typ</Label>
            <Select value={type} onValueChange={setType} disabled={isSubmitting}>
              <SelectTrigger id="entity-type">
                <SelectValue placeholder="Wybierz typ bytu" />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map((entityType) => (
                  <SelectItem key={entityType} value={entityType}>
                    {mapEntityTypeToLabel(entityType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-description">Opis (opcjonalnie)</Label>
            <Textarea
              id="entity-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Dodaj krótki opis lub kontekst"
              maxLength={1000}
              rows={5}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "entity-description-error" : undefined}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Pozostało znaków: {Math.max(0, 1000 - description.length)}</span>
            </div>
            {errors.description && (
              <p id="entity-description-error" className="text-sm text-destructive">
                {errors.description}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitting ? "Zapisywanie..." : mode === "edit" ? "Zapisz zmiany" : "Dodaj byt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function mapEntityTypeToLabel(type: string): string {
  switch (type) {
    case "person":
      return "Osoba";
    case "work":
      return "Dzieło";
    case "epoch":
      return "Epoka";
    case "idea":
      return "Idea";
    case "school":
      return "Szkoła";
    case "system":
      return "System";
    case "other":
      return "Inne";
    default:
      return type;
  }
}
