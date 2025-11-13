import { useMemo, useState, useEffect, useRef } from "react";
import type { JSX } from "react";
import { Plus, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { entityTypes } from "@/lib/validation";
import type { EntitiesFilterState } from "@/components/entities/types.ts";
import { memo } from "react";

interface EntitiesTableToolbarProps {
  filterType: EntitiesFilterState["type"];
  onSearchChange: (value: string) => void;
  onFilterChange: (value: EntitiesFilterState["type"]) => void;
  onAddClick: () => void;
  isDisabled?: boolean;
}

const SEARCH_DEBOUNCE_MS = 350;

function EntitiesTableToolbarComponent({
  filterType,
  onSearchChange,
  onFilterChange,
  onAddClick,
  isDisabled = false,
}: EntitiesTableToolbarProps): JSX.Element {
  const [localSearchValue, setLocalSearchValue] = useState<string>("");
  const debounceTimerRef = useRef<number | null>(null);

  // Debounce the parent search change
  useEffect(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      onSearchChange(localSearchValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localSearchValue, onSearchChange]);

  const filterOptions = useMemo(() => {
    return [
      { value: "all", label: "Wszystkie typy" },
      ...entityTypes.map((type) => ({
        value: type,
        label: mapEntityTypeToLabel(type),
      })),
    ];
  }, []);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearchValue}
            onChange={(event) => setLocalSearchValue(event.target.value)}
            placeholder="Szukaj bytów po nazwie..."
            className="pl-9"
            disabled={isDisabled}
            aria-label="Pole wyszukiwania bytów"
          />
        </div>

        <Select
          value={filterType}
          onValueChange={(value) => onFilterChange(value as EntitiesFilterState["type"])}
          disabled={isDisabled}
        >
          <SelectTrigger className="md:w-56" aria-label="Filtruj po typie bytu">
            <SelectValue placeholder="Filtruj po typie" />
          </SelectTrigger>
          <SelectContent align="end">
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onAddClick} disabled={isDisabled} className="self-start md:self-auto">
        <Plus className="mr-2 size-4" />
        Dodaj byt
      </Button>
    </div>
  );
}

export const EntitiesTableToolbar = memo(EntitiesTableToolbarComponent);

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
