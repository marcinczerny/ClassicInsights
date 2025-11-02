/**
 * GraphToolbar component
 *
 * Toolbar with controls for interacting with the graph
 */

import { Button } from "@/components/ui/button";

interface GraphToolbarProps {
  onToggleConnectionMode?: () => void;
  isConnectionMode?: boolean;
}

export function GraphToolbar({ onToggleConnectionMode, isConnectionMode = false }: GraphToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b bg-background p-2">
      <div className="flex-1">
        <span className="text-sm text-muted-foreground">
          Kliknij węzeł, aby wyśrodkować graf
        </span>
      </div>

      {/* Connection mode toggle - will be fully implemented in step 6 */}
      {onToggleConnectionMode && (
        <Button
          variant={isConnectionMode ? "default" : "outline"}
          size="sm"
          onClick={onToggleConnectionMode}
        >
          {isConnectionMode ? "Anuluj łączenie" : "Tryb łączenia"}
        </Button>
      )}
    </div>
  );
}
