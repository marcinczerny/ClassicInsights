import type { SupabaseClient } from "@/db/supabase.client";
import type { GraphDTO, GraphNodeDTO, GraphEdgeDTO } from "@/types";

export async function getGraphData(
  supabase: SupabaseClient,
  userId: string,
  centerNodeId: string | null
): Promise<GraphDTO> {
  if (!centerNodeId) {
    return { nodes: [], edges: [] };
  }

  // First, fetch all graph data for the user, as the relationships are complex
  const allNodes: GraphNodeDTO[] = [];
  const allEdges: GraphEdgeDTO[] = [];
  const nodeIds = new Set<string>();

  const { data: entities, error: entitiesError } = await supabase
    .from("entities")
    .select("*")
    .eq("user_id", userId);
  if (entitiesError) throw new Error("Failed to fetch entities.");

  entities.forEach((entity) => {
    if (!nodeIds.has(entity.id)) {
      const entityDescription = entity.description
        ? entity.description.substring(0, 100) + (entity.description.length > 100 ? "..." : "")
        : undefined;
      allNodes.push({
        id: entity.id,
        type: "entity",
        name: entity.name,
        entity_type: entity.type,
        description: entityDescription ?? null,
        created_at: entity.created_at,
      });
      nodeIds.add(entity.id);
    }
  });

  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId);
  if (notesError) throw new Error("Failed to fetch notes.");

  notes.forEach((note) => {
    if (!nodeIds.has(note.id)) {
      const notePreview = note.content
        ? note.content.substring(0, 100) + (note.content.length > 100 ? "..." : "")
        : undefined;
      allNodes.push({
        id: note.id,
        type: "note",
        name: note.title,
        note_preview: notePreview,
        created_at: note.created_at,
      });
      nodeIds.add(note.id);
    }
  });

  const noteIdsList = notes.map((n) => n.id);
  if (noteIdsList.length > 0) {
    const { data: noteEntityLinks, error: noteEntityLinksError } = await supabase
      .from("note_entities")
      .select("*")
      .in("note_id", noteIdsList);
    if (noteEntityLinksError) throw new Error("Failed to fetch note-entity links.");
    noteEntityLinks.forEach((link) => {
      allEdges.push({
        id: `ne-${link.note_id}-${link.entity_id}`,
        source_id: link.note_id,
        target_id: link.entity_id,
        type: link.type,
        created_at: link.created_at,
      });
    });
  }

  const entityIdsList = entities.map((e) => e.id);
  if (entityIdsList.length > 0) {
    const { data: relationships, error: relationshipsError } = await supabase
      .from("relationships")
      .select("*")
      .in("source_entity_id", entityIdsList);
    if (relationshipsError) throw new Error("Failed to fetch relationships.");
    relationships.forEach((rel) => {
      allEdges.push({
        id: rel.id,
        source_id: rel.source_entity_id,
        target_id: rel.target_entity_id,
        type: rel.type,
        created_at: rel.created_at,
      });
    });
  }

  // Now, filter the graph to only include nodes and edges within 2 degrees of the center node
  const centerNode = allNodes.find((n) => n.id === centerNodeId);
  if (!centerNode) {
    return { nodes: [], edges: [] };
  }

  const firstDegreeNodeIds = new Set<string>();
  allEdges.forEach((edge) => {
    if (edge.source_id === centerNodeId) {
      firstDegreeNodeIds.add(edge.target_id);
    }
    if (edge.target_id === centerNodeId) {
      firstDegreeNodeIds.add(edge.source_id);
    }
  });

  const secondDegreeNodeIds = new Set<string>();
  allEdges.forEach((edge) => {
    if (firstDegreeNodeIds.has(edge.source_id) && edge.target_id !== centerNodeId) {
      secondDegreeNodeIds.add(edge.target_id);
    }
    if (firstDegreeNodeIds.has(edge.target_id) && edge.source_id !== centerNodeId) {
      secondDegreeNodeIds.add(edge.source_id);
    }
  });

  const subgraphNodeIds = new Set([centerNodeId, ...firstDegreeNodeIds, ...secondDegreeNodeIds]);
  const subgraphNodes = allNodes.filter((n) => subgraphNodeIds.has(n.id));
  const subgraphEdges = allEdges.filter(
    (e) => subgraphNodeIds.has(e.source_id) && subgraphNodeIds.has(e.target_id)
  );

  return { nodes: subgraphNodes, edges: subgraphEdges };
}
