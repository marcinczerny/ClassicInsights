/**
 * Helper functions for graph data transformation
 *
 * Converts GraphDTO to @xyflow/react format and vice versa
 */

import type { Node, Edge } from "@xyflow/react";
import type { GraphDTO, GraphNodeDTO, GraphEdgeDTO } from "@/types";

/**
 * Transform GraphDTO to @xyflow/react format
 */
export function transformGraphData(
  graphData: GraphDTO | null,
  selectedSourceNode: string | null = null
): {
  nodes: Node[];
  edges: Edge[];
} {
  if (!graphData) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = graphData.nodes.map((node, index) => {
    const { id, type, ...nodeData } = node;
    return {
      id,
      type, // 'entity' or 'note'
      position: calculatePosition(index, graphData.nodes.length),
      data: {
        ...nodeData,
        label: node.name,
        isSelected: node.id === selectedSourceNode,
      },
      className: node.id === selectedSourceNode ? "ring-4 ring-primary" : undefined,
    };
  });

  const edges: Edge[] = graphData.edges.map((edge) => ({
    id: edge.id,
    source: edge.source_id,
    target: edge.target_id,
    type: "smoothstep",
    animated: false,
    label: formatRelationshipType(edge.type),
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
    },
    data: edge,
  }));

  return { nodes, edges };
}

/**
 * Calculate node position in a circular layout
 */
function calculatePosition(index: number, total: number): { x: number; y: number } {
  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  if (total === 1) {
    return { x: centerX, y: centerY };
  }

  const angle = (2 * Math.PI * index) / total;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);

  return { x, y };
}

/**
 * Format relationship type for display
 */
function formatRelationshipType(type: string): string {
  const typeMap: Record<string, string> = {
    is_related_to: "powiązane",
    is_part_of: "część",
    is_example_of: "przykład",
    is_opposite_of: "przeciwne",
    causes: "powoduje",
    is_used_by: "używane przez",
  };

  return typeMap[type] || type;
}
