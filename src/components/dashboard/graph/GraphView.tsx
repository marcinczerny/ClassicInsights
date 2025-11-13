/**
 * GraphView component
 *
 * Interactive component that renders the graph (nodes and edges) using @xyflow/react.
 * Handles panning, zooming, node selection, and creating connections.
 */

import { useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./CustomNodes";
import { transformGraphData } from "./graphHelpers";
import type { GraphDTO } from "@/types";

interface GraphViewProps {
  graphData: GraphDTO | null;
  hasNotes: boolean;
  isConnectionMode?: boolean;
  selectedSourceNode?: string | null;
  graphCenterNode?: { id: string; type: "note" | "entity" } | null;
  onNodeClick?: (node: { id: string; type: "note" | "entity" }) => void;
  onEdgeClick?: (edge: { id: string; source: string; target: string }) => void;
}

function GraphViewInner({
  graphData,
  hasNotes,
  isConnectionMode = false,
  selectedSourceNode = null,
  graphCenterNode,
  onNodeClick,
  onEdgeClick,
}: GraphViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => transformGraphData(graphData, selectedSourceNode),
    [graphData, selectedSourceNode]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  /**
   * Update nodes and edges when graphData changes
   */
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  /**
   * Center view on selected node when graphCenterNode changes
   */
  useEffect(() => {
    if (graphCenterNode && nodes.length > 0) {
      const centerNode = nodes.find((node) => node.id === graphCenterNode.id);
      if (centerNode) {
        // Use setTimeout to ensure the DOM is updated
        setTimeout(() => {
          fitView({
            nodes: [centerNode],
            padding: 0.2,
            includeHiddenNodes: false,
            minZoom: 0.1,
            maxZoom: 2,
          });
        }, 100);
      }
    }
  }, [graphCenterNode, nodes, fitView]);

  /**
   * Handle node click - reload graph centered on clicked node
   */
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      if (onNodeClick) {
        onNodeClick({
          id: node.id,
          type: node.type as "note" | "entity",
        });
      }
    },
    [onNodeClick]
  );

  /**
   * Handle edge click - edit relationship
   */
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: any) => {
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
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "entity") return "#6366f1";
            if (node.type === "note") return "#f59e0b";
            return "#94a3b8";
          }}
          className="!bg-background !border !border-border"
        />
      </ReactFlow>
    </div>
  );
}

export function GraphView(props: GraphViewProps) {
  return (
    <ReactFlowProvider>
      <GraphViewInner {...props} />
    </ReactFlowProvider>
  );
}
