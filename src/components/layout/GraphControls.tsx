import { Network } from "lucide-react";
import { useStore } from "@nanostores/react";
import { Button } from "@/components/ui/button";
import { $isGraphPanelVisible, toggleGraphPanel } from "@/stores/app-store";

export function GraphControls() {
  const isGraphPanelVisible = useStore($isGraphPanelVisible);

  const handleToggle = () => {
    toggleGraphPanel();
    console.log("Graph panel toggled:", !isGraphPanelVisible);
  };

  return (
    <Button
      variant={isGraphPanelVisible ? "default" : "ghost"}
      size="icon"
      onClick={handleToggle}
      aria-label="Przełącz panel grafu"
      title={isGraphPanelVisible ? "Ukryj panel grafu" : "Pokaż panel grafu"}
    >
      <Network className="h-5 w-5" />
    </Button>
  );
}
