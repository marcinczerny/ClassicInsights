/**
 * AISuggestionsPanel component
 *
 * Panel displaying a list of AI-generated suggestions for the current note.
 * Includes a button to trigger analysis and handles loading states.
 */

import { Button } from "@/components/ui/button";
import { AISuggestionCard } from "./AISuggestionCard";
import type { SuggestionViewModel } from "./types";

interface AISuggestionsPanelProps {
  noteId: string | "new";
  suggestions: SuggestionViewModel[];
  isAnalyzing: boolean;
  isAnalyzeDisabled: boolean;
  analyzeDisabledReason?: string;
  onAnalyze: () => void;
  onAccept: (suggestionId: string) => void;
  onReject: (suggestionId: string) => void;
}

export function AISuggestionsPanel({
  noteId,
  suggestions,
  isAnalyzing,
  isAnalyzeDisabled,
  analyzeDisabledReason,
  onAnalyze,
  onAccept,
  onReject,
}: AISuggestionsPanelProps) {
  const handleAnalyze = () => {
    if (isAnalyzeDisabled || isAnalyzing) return;
    onAnalyze();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sugestie AI</h2>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzeDisabled || isAnalyzing}
          size="sm"
          title={analyzeDisabledReason}
        >
          {isAnalyzing ? "Analizowanie..." : "Analizuj"}
        </Button>
      </div>

      {/* Loading state */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Analizowanie notatki...</p>
        </div>
      )}

      {/* Suggestions list */}
      {!isAnalyzing && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <AISuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={onAccept}
              onReject={onReject}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isAnalyzing && suggestions.length === 0 && noteId !== "new" && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>Brak sugestii dla tej notatki.</p>
          <p className="mt-1">Kliknij &quot;Analizuj&quot;, aby wygenerować sugestie.</p>
        </div>
      )}

      {/* New note state */}
      {noteId === "new" && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>Zapisz notatkę, aby móc wygenerować sugestie AI.</p>
        </div>
      )}

      {/* Disabled reason */}
      {isAnalyzeDisabled && analyzeDisabledReason && noteId !== "new" && !isAnalyzing && (
        <div className="rounded-md bg-muted p-3">
          <p className="text-xs text-muted-foreground">{analyzeDisabledReason}</p>
        </div>
      )}
    </div>
  );
}
