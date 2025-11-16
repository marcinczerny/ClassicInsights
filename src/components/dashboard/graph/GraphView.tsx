/**
 * GraphView component
 *
 * Interactive component that renders the graph (nodes and edges) using @xyflow/react.
 * Handles panning, zooming, node selection, and creating connections.
 */

import { useCallback, useEffect, useRef } from "react";
import { ReactFlow, Background, Controls, MiniMap, useReactFlow } from "@xyflow/react";
import type { Node, Edge, OnNodesChange, OnEdgesChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./CustomNodes";
import type { GraphDTO } from "@/types";

interface GraphViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeSelect?: (node: { id: string; type: "note" | "entity" }) => void;
  onNodeClick?: (node: { id: string; type: "note" | "entity" }) => void;
  onEdgeClick?: (edge: { id: string; source: string; target: string }) => void;
  graphCenterNode?: { id: string; type: "note" | "entity" } | null;
  hasNotes: boolean;
  graphData: GraphDTO | null;
  selectedNodeId?: string | null;
}

export function GraphView({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  onNodeClick,
  onEdgeClick,
  graphCenterNode,
  hasNotes,
  graphData,
  selectedNodeId,
}: GraphViewProps) {
  const { fitView, setNodes } = useReactFlow();
  const prevCenterNodeIdRef = useRef<string | null | undefined>(null);

  /**
   * Center view on selected node when graphCenterNode changes
   */
  useEffect(() => {
    if (graphCenterNode && nodes.length > 0 && prevCenterNodeIdRef.current !== graphCenterNode.id) {
      // Use setTimeout to ensure the DOM is updated
      setTimeout(() => {
        fitView({
          padding: 0.2,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 2,
        });
      }, 100);
    }
    prevCenterNodeIdRef.current = graphCenterNode?.id;
  }, [graphCenterNode, nodes, fitView]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelectedForCentering: node.id === selectedNodeId,
        },
      }))
    );
  }, [selectedNodeId, setNodes]);

  /**
   * Handle node click - reload graph centered on clicked node
   */
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const target = event.target as HTMLElement;

      // Check if the click was on the center button
      if (target.closest(".center-graph-button")) {
        event.stopPropagation(); // Stop event from bubbling to the node handler
        if (onNodeSelect) {
          onNodeSelect({
            id: node.id,
            type: node.type as "note" | "entity",
          });
        }
        return; // Stop execution
      }

      // Handle regular node click
      if (onNodeClick) {
        onNodeClick({
          id: node.id,
          type: node.type as "note" | "entity",
        });
      }
    },
    [onNodeClick, onNodeSelect]
  );

  /**
   * Handle edge click - edit relationship
   */
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick) {
        onEdgeClick({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        });
      }
    },
    [onEdgeClick]
  );

  // Empty state when no notes exist
  if (!hasNotes) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="mb-2 text-4xl">📝</div>
          <p className="mb-2 font-semibold">Graf jest pusty</p>
          <p className="text-sm">Dodaj pierwszą notatkę, aby zobaczyć graf</p>
        </div>
      </div>
    );
  }

  // Empty state when notes exist but no graph data
  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="mb-2 text-4xl">🕸️</div>
          <p className="mb-2">Brak danych do wyświetlenia</p>
          <p className="text-sm">Wybierz notatkę z listy po lewej</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView={false}
        attributionPosition="bottom-left"
        minZoom={0.1}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "entity") return "#6366f1";
            if (node.type === "note") return "#f59e0b";
            return "#94a3b8";
          }}
          className={
            "!bg-background !border !border-border " +
            "!w-28 !h-20 " + // <-- Mobile size (e.g., 112px x 80px)
            "md:!w-48 md:!h-36" // <-- Desktop size (e.g., 192px x 144px)
          }
        />
      </ReactFlow>
    </div>
  );
}
