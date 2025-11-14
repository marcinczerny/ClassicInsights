import type { SupabaseClient } from "@/db/supabase.client";
import type { GraphDTO, GraphNodeDTO, GraphEdgeDTO } from "@/types";

export async function getGraphData(supabase: SupabaseClient, userId: string): Promise<GraphDTO> {
  const nodes: GraphNodeDTO[] = [];
  const edges: GraphEdgeDTO[] = [];
  const nodeIds = new Set<string>();

  // Fetch all entities for the user
  const { data: entities, error: entitiesError } = await supabase.from("entities").select("*").eq("user_id", userId);

  if (entitiesError) {
    console.error("Error fetching entities for graph:", entitiesError);
    throw new Error("Failed to fetch entities.");
  }

  entities.forEach((entity) => {
    if (!nodeIds.has(entity.id)) {
      nodes.push({
        id: entity.id,
        type: "entity",
        name: entity.name,
        entity_type: entity.type,
        description: entity.description,
        created_at: entity.created_at,
      });
      nodeIds.add(entity.id);
    }
  });

  // Fetch all notes for the user
  const { data: notes, error: notesError } = await supabase.from("notes").select("*").eq("user_id", userId);

  if (notesError) {
    console.error("Error fetching notes for graph:", notesError);
    throw new Error("Failed to fetch notes.");
  }

  notes.forEach((note) => {
    if (!nodeIds.has(note.id)) {
      const notePreview = note.content
        ? note.content.substring(0, 100) + (note.content.length > 100 ? "..." : "")
        : undefined;
      nodes.push({
        id: note.id,
        type: "note",
        name: note.title,
        note_preview: notePreview,
        created_at: note.created_at,
      });
      nodeIds.add(note.id);
    }
  });

  // Fetch all note-entity relationships for the user's notes
  const noteIdsList = notes.map((n) => n.id);
  if (noteIdsList.length > 0) {
    const { data: noteEntityLinks, error: noteEntityLinksError } = await supabase
      .from("note_entities")
      .select("*")
      .in("note_id", noteIdsList);

    if (noteEntityLinksError) {
      console.error("Error fetching note-entity links:", noteEntityLinksError);
      throw new Error("Failed to fetch note-entity links.");
    }

    noteEntityLinks.forEach((link) => {
      edges.push({
        id: `ne-${link.note_id}-${link.entity_id}`,
        source_id: link.note_id,
        target_id: link.entity_id,
        type: link.type,
        created_at: link.created_at,
      });
    });
  }

  // Fetch all entity-entity relationships for the user's entities
  const entityIdsList = entities.map((e) => e.id);
  if (entityIdsList.length > 0) {
    const { data: relationships, error: relationshipsError } = await supabase
      .from("relationships")
      .select("*")
      .in("source_entity_id", entityIdsList);

    if (relationshipsError) {
      console.error("Error fetching relationships:", relationshipsError);
      throw new Error("Failed to fetch relationships.");
    }

    relationships.forEach((rel) => {
      edges.push({
        id: rel.id,
        source_id: rel.source_entity_id,
        target_id: rel.target_entity_id,
        type: rel.type,
        created_at: rel.created_at,
      });
    });
  }

  return { nodes, edges };
}
