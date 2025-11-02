/**
 * GraphPanel component
 *
 * Container for thought graph visualization.
 * Manages visibility state (collapsed, open, fullscreen) and contains
 * tools for interacting with the graph.
 */

import { useState, useCallback } from "react";
import { GraphView } from "./GraphView";
import { GraphToolbar } from "./GraphToolbar";
import { RelationshipModal } from "./RelationshipModal";
import { EditRelationshipModal } from "./EditRelationshipModal";
import { Button } from "@/components/ui/button";
import type { GraphDTO, CreateRelationshipCommand } from "@/types";
import type { Enums } from "@/db/database.types";

interface GraphPanelProps {
  graphData: GraphDTO | null;
  isLoading: boolean;
  error: Error | null;
  panelState: 'collapsed' | 'open' | 'fullscreen';
  hasNotes: boolean;
  graphCenterNode: { id: string; type: 'note' | 'entity' } | null;
  onNodeSelect: (node: { id: string; type: 'note' | 'entity' }) => void;
  onCreateRelationship: (command: CreateRelationshipCommand) => void;
  onPanelStateChange: (state: 'collapsed' | 'open' | 'fullscreen') => void;
}

export function GraphPanel({
  graphData,
  isLoading,
  error,
  panelState,
  hasNotes,
  graphCenterNode,
  onNodeSelect,
  onCreateRelationship,
  onPanelStateChange,
}: GraphPanelProps) {
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  const [selectedSourceNode, setSelectedSourceNode] = useState<string | null>(null);
  const [pendingConnection, setPendingConnection] = useState<{
    source: string;
    target: string;
    sourceNode?: any;
    targetNode?: any;
  } | null>(null);
  const [editingEdge, setEditingEdge] = useState<{
    id: string;
    source: string;
    target: string;
    type: Enums<"relationship_type">;
    sourceNode?: any;
    targetNode?: any;
  } | null>(null);

  /**
   * Handle node click in connection mode
   */
  const handleNodeClickInConnectionMode = useCallback((nodeId: string) => {
    if (!graphData) return;

    const clickedNode = graphData.nodes.find(n => n.id === nodeId);
    if (!clickedNode) return;

    // Validate: only entities can be connected
    if (clickedNode.type !== 'entity') {
      console.error("Only entities can be connected");
      // TODO: Show error toast
      return;
    }

    // First click: select source node
    if (!selectedSourceNode) {
      setSelectedSourceNode(nodeId);
      return;
    }

    // Second click: validate and open modal
    if (selectedSourceNode === nodeId) {
      // Clicking the same node - deselect
      setSelectedSourceNode(null);
      return;
    }

    // Find both nodes
    const sourceNode = graphData.nodes.find(n => n.id === selectedSourceNode);
    const targetNode = clickedNode;

    if (!sourceNode) {
      setSelectedSourceNode(null);
      return;
    }

    // Validate: both must be entities
    if (sourceNode.type !== 'entity' || targetNode.type !== 'entity') {
      console.error("Both nodes must be entities to create a relationship");
      setSelectedSourceNode(null);
      return;
    }

    // Open modal to select relationship type
    setPendingConnection({
      source: selectedSourceNode,
      target: nodeId,
      sourceNode,
      targetNode,
    });
  }, [graphData, selectedSourceNode]);

  /**
   * Handle relationship type confirmation from modal
   */
  const handleRelationshipConfirm = useCallback(async (type: Enums<"relationship_type">) => {
    if (!pendingConnection) return;

    const command: CreateRelationshipCommand = {
      source_entity_id: pendingConnection.source,
      target_entity_id: pendingConnection.target,
      type,
    };

    try {
      await onCreateRelationship(command);
      setPendingConnection(null);
      setSelectedSourceNode(null);
      setIsConnectionMode(false);
    } catch (error) {
      console.error("Failed to create relationship:", error);
      // TODO: Show error toast
    }
  }, [pendingConnection, onCreateRelationship]);

  /**
   * Handle relationship modal cancel
   */
  const handleRelationshipCancel = useCallback(() => {
    setPendingConnection(null);
    setSelectedSourceNode(null);
  }, []);

  /**
   * Handle edge click for editing relationship
   */
  const handleEdgeClick = useCallback((edge: { id: string; source: string; target: string }) => {
    if (!graphData) return;

    // Find edge data from graphData
    const edgeData = graphData.edges.find(e => e.id === edge.id);
    if (!edgeData) return;

    // Find source and target nodes
    const sourceNode = graphData.nodes.find(n => n.id === edge.source);
    const targetNode = graphData.nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    // Only allow editing relationships between entities (not note-entity associations)
    if (sourceNode.type !== 'entity' || targetNode.type !== 'entity') {
      console.log("Cannot edit note-entity associations, only entity-entity relationships");
      return;
    }

    setEditingEdge({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edgeData.type,
      sourceNode,
      targetNode,
    });
  }, [graphData]);

  /**
   * Handle relationship update
   */
  const handleRelationshipUpdate = useCallback(async (relationshipId: string, type: Enums<"relationship_type">) => {
    try {
      const response = await fetch(`/api/relationships/${relationshipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error("Failed to update relationship");
      }

      // Refresh graph
      if (graphCenterNode) {
        onNodeSelect(graphCenterNode);
      }

      setEditingEdge(null);
    } catch (error) {
      console.error("Error updating relationship:", error);
      // TODO: Show error toast
    }
  }, [graphCenterNode, onNodeSelect]);

  /**
   * Handle relationship deletion
   */
  const handleRelationshipDelete = useCallback(async (relationshipId: string) => {
    try {
      const response = await fetch(`/api/relationships/${relationshipId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete relationship");
      }

      // Refresh graph
      if (graphCenterNode) {
        onNodeSelect(graphCenterNode);
      }

      setEditingEdge(null);
    } catch (error) {
      console.error("Error deleting relationship:", error);
      // TODO: Show error toast
    }
  }, [graphCenterNode, onNodeSelect]);

  /**
   * Handle edit modal cancel
   */
  const handleEditCancel = useCallback(() => {
    setEditingEdge(null);
  }, []);

  if (panelState === 'collapsed') {
    return (
      <div className="flex items-center justify-center border-l bg-muted p-4">
        <button
          onClick={() => onPanelStateChange('open')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Rozwiń graf
        </button>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col bg-background ${panelState === 'fullscreen' ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Graf myśli</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onPanelStateChange('collapsed')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Zwiń
          </button>
          {panelState !== 'fullscreen' && (
            <button
              onClick={() => onPanelStateChange('fullscreen')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pełny ekran
            </button>
          )}
          {panelState === 'fullscreen' && (
            <button
              onClick={() => onPanelStateChange('open')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Zamknij pełny ekran
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <GraphToolbar
        isConnectionMode={isConnectionMode}
        onToggleConnectionMode={() => setIsConnectionMode(!isConnectionMode)}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Ładowanie grafu...</div>
          </div>
        )}

        {error && (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-2 text-destructive">Błąd ładowania grafu</div>
            <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              Spróbuj ponownie
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <GraphView
            graphData={graphData}
            hasNotes={hasNotes}
            isConnectionMode={isConnectionMode}
            selectedSourceNode={selectedSourceNode}
            onNodeClick={isConnectionMode
              ? (node) => handleNodeClickInConnectionMode(node.id)
              : onNodeSelect
            }
            onEdgeClick={!isConnectionMode ? handleEdgeClick : undefined}
          />
        )}
      </div>

      {/* Create Relationship Modal */}
      {pendingConnection && pendingConnection.sourceNode && pendingConnection.targetNode && (
        <RelationshipModal
          isOpen={!!pendingConnection}
          sourceEntityName={pendingConnection.sourceNode.name}
          targetEntityName={pendingConnection.targetNode.name}
          onConfirm={handleRelationshipConfirm}
          onCancel={handleRelationshipCancel}
        />
      )}

      {/* Edit Relationship Modal */}
      {editingEdge && editingEdge.sourceNode && editingEdge.targetNode && (
        <EditRelationshipModal
          isOpen={!!editingEdge}
          relationshipId={editingEdge.id}
          sourceEntityName={editingEdge.sourceNode.name}
          targetEntityName={editingEdge.targetNode.name}
          currentType={editingEdge.type}
          onConfirm={handleRelationshipUpdate}
          onCancel={handleEditCancel}
          onDelete={handleRelationshipDelete}
        />
      )}
    </div>
  );
}
