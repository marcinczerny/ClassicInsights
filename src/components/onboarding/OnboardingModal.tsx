import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCtaClick: () => void;
}

export function OnboardingModal({ isOpen, onClose, onCtaClick }: OnboardingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Witaj w ClassicInsights!</DialogTitle>
          <DialogDescription>
            Aplikacja ClassicInsights pomaga organizować Twoje myśli i wiedzę poprzez tworzenie
            notatek połączonych z encjami. Zacznij od stworzenia swojej pierwszej notatki, aby
            poznać możliwości systemu.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onCtaClick}>Stwórz pierwszą notatkę</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
