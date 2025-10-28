/**
 * Graph Service
 * Handles building visualization graphs of entities and notes with their relationships
 *
 * Performance optimizations:
 * - Batch queries to reduce N+1 problems
 * - Maximum nodes limit to prevent graph explosion
 * - Early termination when limit is reached
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { GraphDTO, GraphNodeDTO, GraphEdgeDTO } from "../../types";
import { NotFoundError, ForbiddenError } from "../errors/api-errors";

/**
 * Maximum number of nodes to include in graph to prevent performance issues
 */
const MAX_NODES = 200;

/**
 * Query parameters for graph building
 */
type GraphQueryParams = {
  center_id: string;
  center_type: "entity" | "note";
  levels: number;
};

/**
 * Internal node reference for BFS traversal
 */
type NodeReference = {
  id: string;
  type: "entity" | "note";
};

/**
 * Verifies that the center node exists and belongs to the authenticated user
 * @throws {NotFoundError} If center node doesn't exist
 * @throws {ForbiddenError} If center node doesn't belong to the user
 */
async function verifyCenterNode(
  supabase: SupabaseClient,
  userId: string,
  centerId: string,
  centerType: "entity" | "note"
): Promise<boolean> {
  if (centerType === "entity") {
    const { data, error } = await supabase
      .from("entities")
      .select("id, user_id")
      .eq("id", centerId)
      .single();

    if (error || !data) {
      return false;
    }

    if (data.user_id !== userId) {
      throw new ForbiddenError("Center node does not belong to the authenticated user");
    }

    return true;
  } else {
    const { data, error } = await supabase
      .from("notes")
      .select("id, user_id")
      .eq("id", centerId)
      .single();

    if (error || !data) {
      return false;
    }

    if (data.user_id !== userId) {
      throw new ForbiddenError("Center node does not belong to the authenticated user");
    }

    return true;
  }
}

/**
 * Fetches details for multiple nodes in batch (optimized to avoid N+1 queries)
 * @param supabase - Supabase client instance
 * @param nodeRefs - Array of node references to fetch
 * @returns Map of node keys to GraphNodeDTO
 */
async function fetchNodesBatch(
  supabase: SupabaseClient,
  nodeRefs: NodeReference[]
): Promise<Map<string, GraphNodeDTO>> {
  const nodesMap = new Map<string, GraphNodeDTO>();

  // Separate entity and note IDs
  const entityIds = nodeRefs
    .filter(ref => ref.type === "entity")
    .map(ref => ref.id);
  const noteIds = nodeRefs
    .filter(ref => ref.type === "note")
    .map(ref => ref.id);

  // Batch fetch entities
  if (entityIds.length > 0) {
    const { data: entities } = await supabase
      .from("entities")
      .select("id, name, type, description, created_at")
      .in("id", entityIds);

    if (entities) {
      for (const entity of entities) {
        const nodeKey = `entity:${entity.id}`;
        nodesMap.set(nodeKey, {
          id: entity.id,
          type: "entity",
          name: entity.name,
          entity_type: entity.type,
          description: entity.description,
          created_at: entity.created_at
        });
      }
    }
  }

  // Batch fetch notes
  if (noteIds.length > 0) {
    const { data: notes } = await supabase
      .from("notes")
      .select("id, title, content, created_at")
      .in("id", noteIds);

    if (notes) {
      for (const note of notes) {
        const nodeKey = `note:${note.id}`;
        // Create note preview (first 100 chars of content)
        const notePreview = note.content
          ? note.content.substring(0, 100) + (note.content.length > 100 ? "..." : "")
          : undefined;

        nodesMap.set(nodeKey, {
          id: note.id,
          type: "note",
          name: note.title,
          note_preview: notePreview,
          created_at: note.created_at
        });
      }
    }
  }

  return nodesMap;
}

/**
 * Finds neighbors for multiple nodes in batch (optimized to avoid N+1 queries)
 * @param supabase - Supabase client instance
 * @param nodeRefs - Array of node references to find neighbors for
 * @param edgesMap - Map to store discovered edges
 * @returns Array of neighbor node references
 */
async function findNeighborsBatch(
  supabase: SupabaseClient,
  nodeRefs: NodeReference[],
  edgesMap: Map<string, GraphEdgeDTO>
): Promise<NodeReference[]> {
  const neighbors: NodeReference[] = [];

  // Separate entity and note IDs
  const entityIds = nodeRefs
    .filter(ref => ref.type === "entity")
    .map(ref => ref.id);
  const noteIds = nodeRefs
    .filter(ref => ref.type === "note")
    .map(ref => ref.id);

  // Batch fetch relationships for entities
  if (entityIds.length > 0) {
    // Fetch outgoing relationships
    const { data: outgoingRels } = await supabase
      .from("relationships")
      .select("id, source_entity_id, target_entity_id, type, created_at")
      .in("source_entity_id", entityIds);

    if (outgoingRels) {
      for (const rel of outgoingRels) {
        const edgeKey = `relationship:${rel.id}`;
        edgesMap.set(edgeKey, {
          id: rel.id,
          source_id: rel.source_entity_id,
          target_id: rel.target_entity_id,
          type: rel.type,
          created_at: rel.created_at
        });
        neighbors.push({ id: rel.target_entity_id, type: "entity" });
      }
    }

    // Fetch incoming relationships
    const { data: incomingRels } = await supabase
      .from("relationships")
      .select("id, source_entity_id, target_entity_id, type, created_at")
      .in("target_entity_id", entityIds);

    if (incomingRels) {
      for (const rel of incomingRels) {
        const edgeKey = `relationship:${rel.id}`;
        edgesMap.set(edgeKey, {
          id: rel.id,
          source_id: rel.source_entity_id,
          target_id: rel.target_entity_id,
          type: rel.type,
          created_at: rel.created_at
        });
        neighbors.push({ id: rel.source_entity_id, type: "entity" });
      }
    }

    // Fetch note associations for entities
    const { data: noteAssocs } = await supabase
      .from("note_entities")
      .select("note_id, entity_id, type, created_at")
      .in("entity_id", entityIds);

    if (noteAssocs) {
      for (const assoc of noteAssocs) {
        const edgeKey = `note-entity:${assoc.note_id}:${assoc.entity_id}`;
        edgesMap.set(edgeKey, {
          id: edgeKey,
          source_id: assoc.note_id,
          target_id: assoc.entity_id,
          type: assoc.type,
          created_at: assoc.created_at
        });
        neighbors.push({ id: assoc.note_id, type: "note" });
      }
    }
  }

  // Batch fetch entity associations for notes
  if (noteIds.length > 0) {
    const { data: entityAssocs } = await supabase
      .from("note_entities")
      .select("note_id, entity_id, type, created_at")
      .in("note_id", noteIds);

    if (entityAssocs) {
      for (const assoc of entityAssocs) {
        const edgeKey = `note-entity:${assoc.note_id}:${assoc.entity_id}`;
        edgesMap.set(edgeKey, {
          id: edgeKey,
          source_id: assoc.note_id,
          target_id: assoc.entity_id,
          type: assoc.type,
          created_at: assoc.created_at
        });
        neighbors.push({ id: assoc.entity_id, type: "entity" });
      }
    }
  }

  return neighbors;
}

/**
 * Main service for building graph structures
 */
export const graphService = {
  /**
   * Builds a graph centered on a specific node (entity or note)
   * Uses BFS to traverse the graph up to specified depth
   *
   * Performance optimizations:
   * - Uses batch queries to fetch multiple nodes/edges at once
   * - Limits maximum nodes to prevent performance issues
   * - Terminates early if node limit is reached
   * - Logs execution time for monitoring
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the authenticated user
   * @param params - Query parameters (center_id, center_type, levels)
   * @returns GraphDTO containing nodes and edges
   * @throws {NotFoundError} If center node doesn't exist
   * @throws {ForbiddenError} If center node doesn't belong to user
   */
  async getGraph(
    supabase: SupabaseClient,
    userId: string,
    params: GraphQueryParams
  ): Promise<GraphDTO> {
    const startTime = performance.now();

    // Step 1: Verify center node exists and belongs to user
    const centerNodeExists = await verifyCenterNode(
      supabase,
      userId,
      params.center_id,
      params.center_type
    );

    if (!centerNodeExists) {
      throw new NotFoundError("Center node not found");
    }

    // Step 2: Initialize data structures for BFS traversal
    const nodesMap = new Map<string, GraphNodeDTO>();
    const edgesMap = new Map<string, GraphEdgeDTO>();
    const visitedNodes = new Set<string>();

    // Track nodes to visit at each level
    let currentLevel: NodeReference[] = [
      { id: params.center_id, type: params.center_type }
    ];

    // Step 3: BFS traversal loop with batch queries
    for (let level = 0; level <= params.levels; level++) {
      // Early termination if we've reached the maximum nodes limit
      if (visitedNodes.size >= MAX_NODES) {
        console.warn(`Graph traversal stopped: reached maximum node limit (${MAX_NODES})`);
        break;
      }

      // Filter out already visited nodes
      const nodesToProcess = currentLevel.filter(node => {
        const nodeKey = `${node.type}:${node.id}`;
        return !visitedNodes.has(nodeKey);
      });

      if (nodesToProcess.length === 0) {
        break;
      }

      // Mark nodes as visited
      for (const node of nodesToProcess) {
        const nodeKey = `${node.type}:${node.id}`;
        visitedNodes.add(nodeKey);
      }

      // Batch fetch node details for all nodes at this level
      const fetchedNodes = await fetchNodesBatch(supabase, nodesToProcess);

      // Add fetched nodes to the map
      for (const [nodeKey, nodeDTO] of fetchedNodes) {
        nodesMap.set(nodeKey, nodeDTO);
      }

      // Find neighbors and edges (only if not at max depth)
      if (level < params.levels) {
        const neighbors = await findNeighborsBatch(
          supabase,
          nodesToProcess,
          edgesMap
        );
        currentLevel = neighbors;
      } else {
        currentLevel = [];
      }
    }

    const endTime = performance.now();
    const executionTime = Math.round(endTime - startTime);

    console.log(
      `Graph built: ${nodesMap.size} nodes, ${edgesMap.size} edges, ` +
      `${params.levels} levels, ${executionTime}ms`
    );

    // Step 4: Return graph data
    return {
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values())
    };
  }
};
