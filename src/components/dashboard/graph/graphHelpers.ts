/**
 * Helper functions for graph data transformation
 *
 * Converts GraphDTO to @xyflow/react format and vice versa
 */

import type { Node, Edge } from "@xyflow/react";
import type { GraphDTO } from "@/types";

/**
 * Transform GraphDTO to @xyflow/react format with concentric layout
 */
export function transformGraphData(
  graphData: GraphDTO | null,
  selectedSourceNode: string | null = null,
  graphCenterNode: { id: string; type: "note" | "entity" } | null = null
): {
  nodes: Node[];
  edges: Edge[];
} {
  if (!graphData || !graphCenterNode || graphData.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const centerNodeId = graphCenterNode.id;

  // 1. Identify layers
  const firstDegreeNodeIds = new Set<string>();
  graphData.edges.forEach((edge) => {
    if (edge.source_id === centerNodeId) firstDegreeNodeIds.add(edge.target_id);
    if (edge.target_id === centerNodeId) firstDegreeNodeIds.add(edge.source_id);
  });

  const secondDegreeNodeIds = new Set<string>();
  graphData.edges.forEach((edge) => {
    if (
      firstDegreeNodeIds.has(edge.source_id) &&
      edge.target_id !== centerNodeId &&
      !firstDegreeNodeIds.has(edge.target_id)
    ) {
      secondDegreeNodeIds.add(edge.target_id);
    }
    if (
      firstDegreeNodeIds.has(edge.target_id) &&
      edge.source_id !== centerNodeId &&
      !firstDegreeNodeIds.has(edge.source_id)
    ) {
      secondDegreeNodeIds.add(edge.source_id);
    }
  });

  // 2. Calculate positions
  const nodePositions = new Map<string, { x: number; y: number }>();
  const centerX = 600;
  const centerY = 400;

  nodePositions.set(centerNodeId, { x: centerX, y: centerY });

  const firstDegreeNodes = Array.from(firstDegreeNodeIds);
  const firstDegreeRadius = Math.max(400, 75 * firstDegreeNodes.length);
  firstDegreeNodes.forEach((nodeId, index) => {
    if (firstDegreeNodes.length === 0) return;
    const angle = (2 * Math.PI * index) / firstDegreeNodes.length;
    const x = centerX + firstDegreeRadius * Math.cos(angle);
    const y = centerY + firstDegreeRadius * Math.sin(angle);
    nodePositions.set(nodeId, { x, y });
  });

  const secondDegreeNodes = Array.from(secondDegreeNodeIds);
  const secondDegreeRadius = firstDegreeRadius + 350;
  const parentAngles = new Map<string, number>();
  firstDegreeNodes.forEach((nodeId, index) => {
    if (firstDegreeNodes.length === 0) return;
    const angle = (2 * Math.PI * index) / firstDegreeNodes.length;
    parentAngles.set(nodeId, angle);
  });

  const nodesByParent = new Map<string, string[]>();
  secondDegreeNodes.forEach((nodeId) => {
    graphData.edges.forEach((edge) => {
      let parentId: string | undefined;
      if (edge.source_id === nodeId && firstDegreeNodeIds.has(edge.target_id)) {
        parentId = edge.target_id;
      } else if (edge.target_id === nodeId && firstDegreeNodeIds.has(edge.source_id)) {
        parentId = edge.source_id;
      }

      if (parentId) {
        if (!nodesByParent.has(parentId)) {
          nodesByParent.set(parentId, []);
        }
        nodesByParent.get(parentId)?.push(nodeId);
      }
    });
  });

  nodesByParent.forEach((children, parentId) => {
    const parentAngle = parentAngles.get(parentId) ?? 0;
    // Increase spread based on number of children. Start at 60deg, add 20deg per extra child.
    const angleSpread = Math.PI / 3 + (children.length - 1) * (Math.PI / 9);
    const startAngle = parentAngle - angleSpread / 2;
    children.forEach((childId, index) => {
      if (nodePositions.has(childId)) return; // Already positioned
      const angle = startAngle + (index / (children.length - 1) || 0) * angleSpread;
      const x = centerX + secondDegreeRadius * Math.cos(angle);
      const y = centerY + secondDegreeRadius * Math.sin(angle);
      nodePositions.set(childId, { x, y });
    });
  });

  // Position any remaining second-degree nodes (orphans in this view) in a circle
  let orphanIndex = 0;
  secondDegreeNodes.forEach((nodeId) => {
    if (!nodePositions.has(nodeId)) {
      const angle = (2 * Math.PI * orphanIndex) / (secondDegreeNodes.length - nodesByParent.size);
      const x = centerX + secondDegreeRadius * Math.cos(angle);
      const y = centerY + secondDegreeRadius * Math.sin(angle);
      nodePositions.set(nodeId, { x, y });
      orphanIndex++;
    }
  });

  // 3. Transform data for React Flow
  const nodes: Node[] = graphData.nodes.map((node) => {
    const { id, type, ...nodeData } = node;
    const isCenterNode = node.id === centerNodeId;
    return {
      id,
      type,
      position: nodePositions.get(id) || { x: 0, y: 0 },
      data: {
        ...nodeData,
        label: node.name,
        isSelected: node.id === selectedSourceNode,
        isCenterNode,
        isSelectedForCentering: false,
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
    labelStyle: {
      fontSize: 20,
      fontWeight: "bold",
    },
    labelBgStyle: {
      fill: "#fff",
      stroke: "#ccc",
      strokeWidth: 1.5,
      borderRadius: 4,
    },
    labelBgPadding: [8, 4],
    data: edge as unknown as Record<string, unknown>,
  }));

  return { nodes, edges };
}

/**
 * Format relationship type for display
 */
export function formatRelationshipType(type: string): string {
  const typeMap: Record<string, string> = {
    is_related_to: "powiązane",
    is_part_of: "część",
    is_example_of: "przykład",
    is_opposite_of: "przeciwne",
    causes: "powoduje",
    is_used_by: "używane przez",
    influenced_by: "pod wpływem",
    expands_on: "rozszerza",
    is_student_of: "uczeń",
    criticizes: "krytykuje",
  };

  return typeMap[type] || type;
}
