/**
 * PaginationControls component
 *
 * Navigation controls for paginated note lists.
 * Disables previous/next buttons when on first/last page.
 */

import { Button } from "@/components/ui/button";
import type { PaginationDTO } from "@/types";

interface PaginationControlsProps {
  pagination: PaginationDTO;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const { page, total_pages } = pagination;

  const isFirstPage = page === 1;
  const isLastPage = page === total_pages;

  return (
    <div className="flex items-center justify-between border-t bg-background p-3">
      <div className="text-sm text-muted-foreground">
        Strona {page} z {total_pages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
        >
          Poprzednia
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
        >
          Następna
        </Button>
      </div>
    </div>
  );
}
