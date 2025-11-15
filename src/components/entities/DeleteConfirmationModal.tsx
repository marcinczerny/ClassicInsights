import type { JSX } from "react";
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
import type { EntityWithCountDTO } from "@/types";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  entity: EntityWithCountDTO | null;
  isDeleting: boolean;
  onConfirmDelete: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  entity,
  isDeleting,
  onConfirmDelete,
  onCancel,
}: DeleteConfirmationModalProps): JSX.Element {
  const handleOpenChange = (open: boolean) => {
    if (!open && !isDeleting) {
      onCancel();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń byt</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć {entity?.name ? `byt "${entity.name}"` : "wybrany byt"}? Ta
            operacja jest nieodwracalna i usunie powiązania z notatkami.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isDeleting}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń byt"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
