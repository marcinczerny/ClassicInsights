/**
 * SearchBar component
 *
 * Search field for filtering notes based on assigned entities (tags).
 * Uses debouncing to optimize API requests during typing and offers
 * autocomplete based on existing entities.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { EntityBasicDTO } from "@/types";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(searchTerm);
  const [suggestions, setSuggestions] = useState<EntityBasicDTO[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Fetch entity suggestions from API
   */
  const fetchSuggestions = useCallback(async (search: string) => {
    if (search.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const params = new URLSearchParams({ search });
      const response = await fetch(`/api/entities?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();
      setSuggestions(data.data.slice(0, 5)); // Limit to 5 suggestions
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  /**
   * Debounced effect for fetching suggestions
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.length >= 2) {
        fetchSuggestions(inputValue);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, fetchSuggestions]);

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onSearchChange(value);
  };

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = (entity: EntityBasicDTO) => {
    setInputValue(entity.name);
    onSearchChange(entity.name);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  /**
   * Handle clear
   */
  const handleClear = () => {
    setInputValue("");
    onSearchChange("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Popover open={showSuggestions && suggestions.length > 0} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Szukaj po bytach (tagach)..."
              value={inputValue}
              onChange={handleInputChange}
              className="pr-8"
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Wyczyść"
              >
                ✕
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-60 overflow-auto">
            {isLoadingSuggestions ? (
              <div className="p-3 text-sm text-muted-foreground">Ładowanie...</div>
            ) : (
              <div className="py-1">
                {suggestions.map((entity) => (
                  <button
                    key={entity.id}
                    onClick={() => handleSuggestionSelect(entity)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entity.type} {entity.description && `• ${entity.description}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
