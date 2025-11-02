/**
 * AISuggestionCard component
 *
 * Displays a single AI suggestion with action buttons (Accept/Reject).
 * Shows loading state during submission.
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SuggestionViewModel } from "./types";

interface AISuggestionCardProps {
  suggestion: SuggestionViewModel;
  onAccept: (suggestionId: string) => void;
  onReject: (suggestionId: string) => void;
}

export function AISuggestionCard({ suggestion, onAccept, onReject }: AISuggestionCardProps) {
  const handleAccept = () => {
    if (suggestion.isSubmitting) return;
    onAccept(suggestion.id);
  };

  const handleReject = () => {
    if (suggestion.isSubmitting) return;
    onReject(suggestion.id);
  };

  // Format suggestion type for display
  const formatType = (type: string) => {
    switch (type) {
      case 'add_entity':
        return 'Dodaj byt';
      case 'add_relationship':
        return 'Dodaj relację';
      case 'content_improvement':
        return 'Poprawa treści';
      default:
        return type;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">{suggestion.name || formatType(suggestion.type)}</CardTitle>
        <CardDescription className="text-xs">{formatType(suggestion.type)}</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {suggestion.content}
        </p>
      </CardContent>

      <CardFooter className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          disabled={suggestion.isSubmitting}
        >
          Odrzuć
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleAccept}
          disabled={suggestion.isSubmitting}
        >
          {suggestion.isSubmitting ? 'Przetwarzanie...' : 'Akceptuj'}
        </Button>
      </CardFooter>
    </Card>
  );
}
