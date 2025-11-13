import { Fragment, useMemo } from "react";
import type { JSX } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { EntitiesSortState, EntitiesSortColumn, PaginationState } from "@/components/entities/types.ts";
import type { EntityWithCountDTO } from "@/types";

interface EntitiesDataTableProps {
  entities: EntityWithCountDTO[];
  pagination: PaginationState | null;
  sorting: EntitiesSortState;
  isLoading: boolean;
  onSortChange: (column: EntitiesSortColumn) => void;
  onPageChange: (page: number) => void;
  onEdit: (entity: EntityWithCountDTO) => void;
  onDelete: (entity: EntityWithCountDTO) => void;
}

interface TableColumn {
  key: EntitiesSortColumn;
  label: string;
  align?: "left" | "right";
}

const TABLE_COLUMNS: TableColumn[] = [
  { key: "name", label: "Nazwa", align: "left" },
  { key: "type", label: "Typ", align: "left" },
  { key: "created_at", label: "Utworzono", align: "left" },
];

export function EntitiesDataTable({
  entities,
  pagination,
  sorting,
  isLoading,
  onSortChange,
  onPageChange,
  onEdit,
  onDelete,
}: EntitiesDataTableProps): JSX.Element {
  const currentPage = pagination?.page ?? 1;
  const totalPages = Math.max(pagination?.total_pages ?? 1, 1);
  const totalItems = pagination?.total ?? entities.length;
  const perPage = pagination?.limit ?? entities.length;
  const loadingRowsCount = Math.min(Math.max(perPage || 5, 5), 10);

  const pageRange = useMemo(() => {
    if (!pagination || totalItems === 0) {
      return null;
    }
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(from + pagination.limit - 1, pagination.total);
    return { from, to };
  }, [pagination, totalItems]);

  const renderSortIcon = (column: EntitiesSortColumn): JSX.Element => {
    if (sorting.column !== column) {
      return <ArrowUpDown className="size-4 text-muted-foreground" />;
    }
    return sorting.order === "asc" ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="relative w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-muted/60">
            <tr>
              {TABLE_COLUMNS.map((column) => {
                const isActive = sorting.column === column.key;
                const ariaSort = isActive ? (sorting.order === "asc" ? "ascending" : "descending") : "none";

                return (
                  <th
                    key={column.key}
                    aria-sort={ariaSort}
                    scope="col"
                    className="border-b border-border px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    <button
                      type="button"
                      onClick={() => onSortChange(column.key)}
                      className="flex items-center gap-2 text-left text-sm font-medium text-foreground transition hover:text-primary"
                      disabled={isLoading}
                    >
                      {column.label}
                      {renderSortIcon(column.key)}
                    </button>
                  </th>
                );
              })}

              <th
                scope="col"
                className="border-b border-border px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Powiązania
              </th>

              <th
                scope="col"
                className="border-b border-border px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <LoadingRows columns={TABLE_COLUMNS.length + 2} rows={loadingRowsCount} />}

            {!isLoading && entities.length === 0 && (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 2} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  Brak wyników spełniających kryteria wyszukiwania.
                </td>
              </tr>
            )}

            {!isLoading &&
              entities.map((entity) => (
                <tr key={entity.id} className="hover:bg-muted/40 transition">
                  <td className="px-6 py-4 align-top text-sm font-medium text-foreground">
                    <div className="space-y-1">
                      <div>{entity.name}</div>
                      {entity.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{entity.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-muted-foreground">
                    <Badge variant="outline">{mapEntityTypeToLabel(entity.type)}</Badge>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-muted-foreground">{formatDate(entity.created_at)}</td>
                  <td className="px-6 py-4 align-top text-right text-sm text-muted-foreground">
                    <Badge variant="secondary">{entity.note_count}</Badge>
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9"
                          aria-label={`Akcje dla bytu ${entity.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            onEdit(entity);
                          }}
                        >
                          Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={(event) => {
                            event.preventDefault();
                            onDelete(entity);
                          }}
                        >
                          Usuń
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          {pageRange ? (
            <span>
              Wyświetlanie <span className="font-medium text-foreground">{pageRange.from}</span>–
              <span className="font-medium text-foreground">{pageRange.to}</span> z{" "}
              <span className="font-medium text-foreground">{pagination?.total}</span> bytów
            </span>
          ) : (
            <span>Liczba bytów: {totalItems}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage <= 1 || isLoading}>
            Poprzednia
          </Button>
          <span className="text-xs font-medium text-muted-foreground">
            Strona {currentPage} z {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isLoading}
          >
            Następna
          </Button>
        </div>
      </div>
    </div>
  );
}

interface LoadingRowsProps {
  columns: number;
  rows: number;
}

function LoadingRows({ columns, rows }: LoadingRowsProps): JSX.Element {
  return (
    <Fragment>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`loading-row-${rowIndex}`} className="animate-pulse">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={`loading-cell-${rowIndex}-${columnIndex}`} className="px-6 py-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </Fragment>
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

function formatDate(input: string): string {
  try {
    const date = new Date(input);
    return new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return input;
  }
}
