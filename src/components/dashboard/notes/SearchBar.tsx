/**
 * SearchBar component
 *
 * Search interface with two fields:
 * 1. Text input for searching by note title
 * 2. Multi-select for filtering by entities (tags)
 */

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { EntityBasicDTO } from "@/types";

interface SearchBarProps {
  titleSearch: string;
  selectedEntityIds: string[];
  onTitleSearchChange: (term: string) => void;
  onEntitySelectionChange: (entityIds: string[]) => void;
}

export function SearchBar({
  titleSearch,
  selectedEntityIds,
  onTitleSearchChange,
  onEntitySelectionChange,
}: SearchBarProps) {
  const [titleInput, setTitleInput] = useState(titleSearch);
  const [entitySearchInput, setEntitySearchInput] = useState("");
  const [availableEntities, setAvailableEntities] = useState<EntityBasicDTO[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<EntityBasicDTO[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [showEntityPopover, setShowEntityPopover] = useState(false);

  /**
   * Fetch entities that match search input
   */
  const fetchAllEntities = useCallback(async () => {
    setIsLoadingEntities(true);
    try {
      const response = await fetch("/api/entities?limit=100");
      if (!response.ok) throw new Error("Failed to fetch entities");

      const data = await response.json();
      setAvailableEntities(data.data || []);
    } catch (error) {
      console.error("Error fetching entities:", error);
      setAvailableEntities([]);
    } finally {
      setIsLoadingEntities(false);
    }
  }, []);

  /**
   * Fetch all user's entities on mount
   */
  useEffect(() => {
    fetchAllEntities();
  }, [fetchAllEntities]);

  /**
   * Filter entities based on search input
   */
  const filteredEntities = availableEntities.filter(
    (entity) =>
      !selectedEntityIds.includes(entity.id) && entity.name.toLowerCase().includes(entitySearchInput.toLowerCase())
  );

  /**
   * Update selected entities display when selectedEntityIds changes
   */
  useEffect(() => {
    const selected = availableEntities.filter((entity) => selectedEntityIds.includes(entity.id));
    setSelectedEntities(selected);
  }, [selectedEntityIds, availableEntities]);

  /**
   * Handle title input change with debouncing
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onTitleSearchChange(titleInput);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [titleInput, onTitleSearchChange]);

  /**
   * Handle entity selection
   */
  const handleEntitySelect = (entity: EntityBasicDTO) => {
    const newSelectedIds = [...selectedEntityIds, entity.id];
    onEntitySelectionChange(newSelectedIds);
    setEntitySearchInput("");
  };

  /**
   * Handle entity removal
   */
  const handleEntityRemove = (entityId: string) => {
    const newSelectedIds = selectedEntityIds.filter((id) => id !== entityId);
    onEntitySelectionChange(newSelectedIds);
  };

  /**
   * Clear title search
   */
  const handleClearTitle = () => {
    setTitleInput("");
    onTitleSearchChange("");
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    setTitleInput("");
    onTitleSearchChange("");
    onEntitySelectionChange([]);
    setEntitySearchInput("");
  };

  return (
    <div className="space-y-3">
      {/* Title Search */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Szukaj po tytule..."
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          className="pr-8"
        />
        {titleInput && (
          <button
            onClick={handleClearTitle}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Wyczyść tytuł"
          >
            ✕
          </button>
        )}
      </div>

      {/* Entity Multi-Select */}
      <div className="space-y-2">
        <Popover open={showEntityPopover} onOpenChange={setShowEntityPopover}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              {selectedEntities.length === 0 ? (
                <span className="text-muted-foreground">Wybierz tagi (encje)...</span>
              ) : (
                <span>{selectedEntities.length} wybranych tagów</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <div className="border-b p-2">
              <Input
                type="text"
                placeholder="Szukaj tagów..."
                value={entitySearchInput}
                onChange={(e) => setEntitySearchInput(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-60 overflow-auto">
              {isLoadingEntities ? (
                <div className="p-3 text-sm text-muted-foreground">Ładowanie...</div>
              ) : filteredEntities.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  {entitySearchInput ? "Brak wyników" : "Wszystkie tagi wybrane"}
                </div>
              ) : (
                <div className="py-1">
                  {filteredEntities.map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => handleEntitySelect(entity)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                    >
                      <div className="font-medium">{entity.name}</div>
                      <div className="text-xs text-muted-foreground">{entity.type}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Selected entities badges */}
        {selectedEntities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedEntities.map((entity) => (
              <Badge key={entity.id} variant="secondary" className="gap-1">
                {entity.name}
                <button
                  onClick={() => handleEntityRemove(entity.id)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Usuń ${entity.name}`}
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Clear all button */}
      {(titleInput || selectedEntityIds.length > 0) && (
        <Button variant="ghost" size="sm" onClick={handleClearAll} className="w-full">
          Wyczyść wszystkie filtry
        </Button>
      )}
    </div>
  );
}
