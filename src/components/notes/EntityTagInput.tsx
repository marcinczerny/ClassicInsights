/**
 * EntityTagInput component
 *
 * Advanced component for managing entities (tags) associated with a note.
 * Features autocomplete, relationship type selection, and entity creation.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreateEntityModal } from "./CreateEntityModal";
import type { NoteEntityViewModel } from "./types";
import type { EntityDTO, CreateEntityCommand } from "@/types";
import type { Enums } from "@/db/database.types";

interface EntityTagInputProps {
  entities: NoteEntityViewModel[];
  onEntitiesChange: (entities: NoteEntityViewModel[]) => void;
}

const RELATIONSHIP_TYPES: Array<{ value: Enums<"relationship_type">; label: string }> = [
  { value: "criticizes", label: "Krytykuje" },
  { value: "is_student_of", label: "Jest uczniem" },
  { value: "expands_on", label: "Rozszerza" },
  { value: "influenced_by", label: "Pod wpływem" },
  { value: "is_example_of", label: "Jest przykładem" },
  { value: "is_related_to", label: "Jest powiązany z" },
];

export function EntityTagInput({ entities, onEntitiesChange }: EntityTagInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<EntityDTO[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch entity suggestions from API (debounced)
   */
  const fetchSuggestions = useCallback(async (search: string) => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const params = new URLSearchParams({
        search,
        limit: "10",
      });

      const response = await fetch(`/api/entities?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch entities");
      }

      const result = await response.json();
      setSuggestions(result.data || []);
    } catch (error) {
      console.error("Failed to fetch entity suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  /**
   * Handle search input change with debouncing
   */
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  /**
   * Add entity to the list
   */
  const handleAddEntity = (entity: EntityDTO, relationshipType: Enums<"relationship_type"> = "is_related_to") => {
    // Check if entity already exists
    const exists = entities.some((e) => e.id === entity.id);
    if (exists) return;

    const newEntity: NoteEntityViewModel = {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      relationship_type: relationshipType,
    };

    onEntitiesChange([...entities, newEntity]);
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  /**
   * Remove entity from the list
   */
  const handleRemoveEntity = (entityId: string) => {
    onEntitiesChange(entities.filter((e) => e.id !== entityId));
  };

  /**
   * Update relationship type for an entity
   */
  const handleUpdateRelationshipType = (entityId: string, relationshipType: Enums<"relationship_type">) => {
    onEntitiesChange(
      entities.map((e) =>
        e.id === entityId ? { ...e, relationship_type: relationshipType } : e
      )
    );
  };

  /**
   * Create new entity via modal
   */
  const handleCreateEntity = async (command: CreateEntityCommand): Promise<EntityDTO> => {
    const response = await fetch("/api/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 409) {
        throw new Error("Entity with this name already exists");
      }
      throw new Error(errorData?.error?.message || "Failed to create entity");
    }

    const newEntity: EntityDTO = await response.json();

    // Automatically add newly created entity to the list
    handleAddEntity(newEntity);

    return newEntity;
  };

  /**
   * Get filtered suggestions (exclude already added entities)
   */
  const filteredSuggestions = suggestions.filter(
    (suggestion) => !entities.some((e) => e.id === suggestion.id)
  );

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <Label>Powiązane byty</Label>

      {/* Selected entities */}
      {entities.length > 0 && (
        <div className="space-y-2">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center gap-2 rounded-md border p-2 bg-muted/50"
            >
              <Badge variant="secondary" className="flex-shrink-0">
                {entity.name}
              </Badge>

              <Select
                value={entity.relationship_type}
                onValueChange={(value) =>
                  handleUpdateRelationshipType(entity.id, value as Enums<"relationship_type">)
                }
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() => handleRemoveEntity(entity.id)}
              >
                <span className="sr-only">Usuń</span>
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Search input with autocomplete */}
      <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              placeholder="Wyszukaj lub dodaj byt..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchTerm.trim() && filteredSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {isLoadingSuggestions ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Wyszukiwanie...
            </div>
          ) : filteredSuggestions.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
                  onClick={() => handleAddEntity(suggestion)}
                >
                  <div className="font-medium">{suggestion.name}</div>
                  <div className="text-xs text-muted-foreground">{suggestion.type}</div>
                </button>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nie znaleziono bytów
            </div>
          ) : null}

          {/* Create new entity button */}
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                setShowCreateModal(true);
                setShowSuggestions(false);
              }}
            >
              + Utwórz nowy byt
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Create entity modal */}
      <CreateEntityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateEntity}
      />
    </div>
  );
}
