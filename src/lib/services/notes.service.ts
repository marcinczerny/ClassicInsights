import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateNoteCommand, NoteDTO, NotesListResponseDTO, UpdateNoteCommand, NoteEntityAssociationDTO } from "@/types";
import type { GetNotesParams } from "../validation";

async function _validateEntities(
  supabase: SupabaseClient,
  entityIds: string[],
  userId: string,
): Promise<void> {
  if (!entityIds || entityIds.length === 0) {
    return;
  }

  const { data: entities, error: entityError } = await supabase
    .from("entities")
    .select("id")
    .in("id", entityIds)
    .eq("user_id", userId);

  if (entityError) {
    console.error("Error verifying entities:", entityError);
    throw new Error("Failed to verify entities.");
  }

  if (entities.length !== entityIds.length) {
    throw new Error("One or more entities not found or do not belong to the user.");
  }
}

export async function getNotes(
  supabase: SupabaseClient,
  userId: string,
  params: GetNotesParams,
): Promise<NotesListResponseDTO> {
  const { page, limit, sort, order, search, entities } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("notes")
    .select(`
      *,
      note_entities(
        type,
        entities(id, name, type, description)
      )
    `, { count: "exact" })
    .eq("user_id", userId);

  if (search) {
    // Search only by title (case-insensitive partial match)
    query = query.ilike('title', `%${search}%`);
  }

  if (entities && entities.length > 0) {
    const { data: notesWithAllEntities, error: rpcError } = await supabase.rpc(
      "get_notes_with_all_entities",
      {
        p_entity_ids: entities,
        p_user_id: userId,
      },
    );

    if (rpcError) {
      throw new Error("Failed to fetch notes by entities.");
    }

    const noteIds = notesWithAllEntities.map((n) => n.id);
    query = query.in("id", noteIds);
  }

  query = query.order(sort, { ascending: order === "asc" }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching notes:", error);
    throw new Error("Failed to fetch notes from the database.");
  }

  // Transform the response to match NoteDTO format with relationship_type
  const transformedData = (data || []).map((note: any) => ({
    ...note,
    entities: (note.note_entities || []).map((ne: any) => ({
      ...ne.entities,
      relationship_type: ne.type,
    })),
    note_entities: undefined, // Remove the junction table data
  }));

  const total = count ?? 0;
  const total_pages = Math.ceil(total / limit);

  return {
    data: transformedData,
    pagination: {
      page,
      limit,
      total,
      total_pages,
    },
  };
}

export async function createNote(
  supabase: SupabaseClient,
  userId: string,
  command: CreateNoteCommand,
): Promise<NoteDTO> {
  const { title, content, entities, entity_ids } = command;

  // 1. Check for duplicate title for the same user
  const { data: existingNote, error: existingNoteError } = await supabase
    .from("notes")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .maybeSingle();

  if (existingNoteError) {
    console.error("Error checking for existing note:", existingNoteError);
    throw new Error("Failed to check for duplicate notes.");
  }

  if (existingNote) {
    throw new Error("A note with this title already exists.");
  }

  // 2. Verify entity ownership for both new and legacy formats
  if (entities && entities.length > 0) {
    const entityIds = entities.map((e) => e.entity_id);
    await _validateEntities(supabase, entityIds, userId);
  } else if (entity_ids && entity_ids.length > 0) {
    await _validateEntities(supabase, entity_ids, userId);
  }

  // 3. Create the note
  const { data: newNote, error: noteError } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      title,
      content: content ?? undefined,
    })
    .select()
    .single();

  if (noteError) {
    console.error("Error creating note:", noteError);
    throw new Error("Failed to create the note.");
  }

  // 4. Link entities to the new note with relationship types
  if (entities && entities.length > 0) {
    // New format: with relationship types
    const noteEntityLinks = entities.map((e) => ({
      note_id: newNote.id,
      entity_id: e.entity_id,
      type: (e.relationship_type || "is_related_to") as "criticizes" | "is_student_of" | "expands_on" | "influenced_by" | "is_example_of" | "is_related_to",
    }));

    const { error: linkError } = await supabase
      .from("note_entities")
      .insert(noteEntityLinks);

    if (linkError) {
      console.error("Error linking entities to note:", linkError);
      throw new Error("Failed to link entities to the note.");
    }
  } else if (entity_ids && entity_ids.length > 0) {
    // Legacy format: default to 'is_related_to'
    const noteEntityLinks = entity_ids.map((entity_id) => ({
      note_id: newNote.id,
      entity_id,
      type: "is_related_to" as const,
    }));

    const { error: linkError } = await supabase
      .from("note_entities")
      .insert(noteEntityLinks);

    if (linkError) {
      console.error("Error linking entities to note:", linkError);
      throw new Error("Failed to link entities to the note.");
    }
  }

  // 5. Fetch and return the complete note DTO with relationship types
  const { data: fullNote, error: fetchError } = await supabase
    .from("notes")
    .select(`
      *,
      note_entities(
        type,
        entities(id, name, type, description)
      )
    `)
    .eq("id", newNote.id)
    .single();

  if (fetchError) {
    console.error("Error fetching created note:", fetchError);
    throw new Error("Failed to fetch the created note.");
  }

  // Transform the response to match NoteDTO format
  const transformedNote = {
    ...fullNote,
    entities: (fullNote.note_entities || []).map((ne: any) => ({
      ...ne.entities,
      relationship_type: ne.type,
    })),
    note_entities: undefined,
  };

  return transformedNote;
}

export async function updateNote(
  supabase: SupabaseClient,
  noteId: string,
  userId: string,
  command: UpdateNoteCommand,
): Promise<NoteDTO> {
  const { title, content, entities, entity_ids } = command;

  // 1. Verify note exists and belongs to the user
  const { data: existingNote, error: fetchError } = await supabase
    .from("notes")
    .select("id, title")
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingNote) {
    throw new Error("Note not found or you do not have permission to edit it.");
  }

  // 2. Check for duplicate title if it's being changed
  if (title && title !== existingNote.title) {
    const { data: duplicateNote, error: duplicateError } = await supabase
      .from("notes")
      .select("id")
      .eq("user_id", userId)
      .eq("title", title)
      .neq("id", noteId)
      .maybeSingle();

    if (duplicateError) {
      console.error("Error checking for duplicate title:", duplicateError);
      throw new Error("Failed to check for duplicate title.");
    }

    if (duplicateNote) {
      throw new Error("A note with this title already exists.");
    }
  }

  // 3. Verify entity ownership for both new and legacy formats
  if (entities && entities.length > 0) {
    const entityIds = entities.map((e) => e.entity_id);
    await _validateEntities(supabase, entityIds, userId);
  } else if (entity_ids && entity_ids.length > 0) {
    await _validateEntities(supabase, entity_ids, userId);
  }

  // 4. Update the note and its entity associations
  // Note: Supabase SDK doesn't directly support transactions.
  // We perform operations sequentially.

  // 4a. Update note details if provided
  if (title !== undefined || content !== undefined) {
    const { error: updateError } = await supabase
      .from("notes")
      .update({ title, content: content ?? undefined })
      .eq("id", noteId);

    if (updateError) {
      console.error("Error updating note:", updateError);
      throw new Error("Failed to update the note.");
    }
  }

  // 4b. Update entity links with relationship types if provided
  if (entities !== undefined) {
    // Delete existing links
    const { error: deleteError } = await supabase
      .from("note_entities")
      .delete()
      .eq("note_id", noteId);

    if (deleteError) {
      console.error("Error removing old entity links:", deleteError);
      throw new Error("Failed to update entity links (delete step).");
    }

    // Insert new links with relationship types
    if (entities.length > 0) {
      const newLinks = entities.map((e) => ({
        note_id: noteId,
        entity_id: e.entity_id,
        type: (e.relationship_type || "is_related_to") as "criticizes" | "is_student_of" | "expands_on" | "influenced_by" | "is_example_of" | "is_related_to",
      }));
      const { error: insertError } = await supabase.from("note_entities").insert(newLinks);

      if (insertError) {
        console.error("Error adding new entity links:", insertError);
        throw new Error("Failed to update entity links (insert step).");
      }
    }
  } else if (entity_ids !== undefined) {
    // Legacy format: delete and re-insert with default relationship type
    const { error: deleteError } = await supabase
      .from("note_entities")
      .delete()
      .eq("note_id", noteId);

    if (deleteError) {
      console.error("Error removing old entity links:", deleteError);
      throw new Error("Failed to update entity links (delete step).");
    }

    if (entity_ids.length > 0) {
      const newLinks = entity_ids.map((entity_id) => ({
        note_id: noteId,
        entity_id: entity_id,
        type: "is_related_to" as const,
      }));
      const { error: insertError } = await supabase.from("note_entities").insert(newLinks);

      if (insertError) {
        console.error("Error adding new entity links:", insertError);
        throw new Error("Failed to update entity links (insert step).");
      }
    }
  }

  // 5. Fetch and return the updated note DTO with relationship types
  const { data: updatedNote, error: finalFetchError } = await supabase
    .from("notes")
    .select(`
      *,
      note_entities(
        type,
        entities(id, name, type, description)
      )
    `)
    .eq("id", noteId)
    .single();

  if (finalFetchError) {
    console.error("Error fetching updated note:", finalFetchError);
    throw new Error("Failed to fetch the updated note.");
  }

  // Transform the response to match NoteDTO format
  const transformedNote = {
    ...updatedNote,
    entities: (updatedNote.note_entities || []).map((ne: any) => ({
      ...ne.entities,
      relationship_type: ne.type,
    })),
    note_entities: undefined,
  };

  return transformedNote;
}

/**
 * Checks for and deletes orphan entities. An orphan entity is one that is no longer
 * associated with any notes after a deletion operation.
 * @param supabase The Supabase client instance.
 * @param entityIdsToCheck An array of entity IDs to check for orphan status.
 */
async function _handleOrphanEntities(
  supabase: SupabaseClient,
  entityIdsToCheck: string[],
): Promise<void> {
  if (entityIdsToCheck.length === 0) {
    return;
  }

  // For each entity, check if it's linked to any other notes
  const { data: remainingLinks, error: linksCheckError } = await supabase
    .from("note_entities")
    .select("entity_id")
    .in("entity_id", entityIdsToCheck);

  if (linksCheckError) {
    console.error("Error checking for remaining entity links:", linksCheckError);
    // This is a partial success state as the primary operation (note/link deletion) succeeded.
    // A transactional approach (e.g., RPC) would be more robust.
    throw new Error("Failed to check for orphan entities.");
  }

  const stillLinkedEntityIds = new Set(remainingLinks.map((link) => link.entity_id));
  const orphanEntityIds = entityIdsToCheck.filter((id) => !stillLinkedEntityIds.has(id));

  if (orphanEntityIds.length > 0) {
    const { error: orphanDeleteError } = await supabase
      .from("entities")
      .delete()
      .in("id", orphanEntityIds);

    if (orphanDeleteError) {
      console.error("Error deleting orphan entities:", orphanDeleteError);
      throw new Error("Failed to delete orphan entities.");
    }
  }
}

export async function deleteNote(supabase: SupabaseClient, noteId: string, userId: string): Promise<void> {
  // 1. Get the list of associated entities before deleting the note
  const { data: noteEntities, error: entitiesFetchError } = await supabase
    .from("note_entities")
    .select("entity_id")
    .eq("note_id", noteId);

  if (entitiesFetchError) {
    console.error("Error fetching entities for note:", entitiesFetchError);
    throw new Error("Failed to fetch associated entities before deletion.");
  }

  const entityIdsToCheck = noteEntities.map((ne) => ne.entity_id);

  // 2. Delete the note. RLS ensures the user can only delete their own notes.
  // The 'note_entities' entries are deleted automatically due to CASCADE constraint.
  const { error: deleteError } = await supabase.from("notes").delete().eq("id", noteId).eq("user_id", userId);

  if (deleteError) {
    console.error("Error deleting note:", deleteError);
    throw new Error("Failed to delete the note.");
  }

  // 3. Check for and delete orphan entities
  await _handleOrphanEntities(supabase, entityIdsToCheck);
}

export async function removeEntityFromNote(
  supabase: SupabaseClient,
  noteId: string,
  entityId: string,
  userId: string,
): Promise<void> {
  // 1. Verify the note belongs to the user to enforce ownership.
  // We don't need the note data, just confirmation it exists for this user.
  const { error: noteCheckError } = await supabase
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (noteCheckError) {
    throw new Error("Note not found or you do not have permission to modify it.");
  }

  // 2. Delete the specific association.
  const { error: deleteError } = await supabase
    .from("note_entities")
    .delete()
    .eq("note_id", noteId)
    .eq("entity_id", entityId);

  if (deleteError) {
    console.error("Error removing entity association:", deleteError);
    throw new Error("Failed to remove entity from note.");
  }

  // 3. Check if the removed entity has become an orphan.
  await _handleOrphanEntities(supabase, [entityId]);
}

export async function addEntityToNote(
  supabase: SupabaseClient,
  noteId: string,
  entityId: string,
  userId: string,
  relationshipType?: "criticizes" | "is_student_of" | "expands_on" | "influenced_by" | "is_example_of" | "is_related_to",
): Promise<NoteEntityAssociationDTO> {
  // 1. Verify that the note and entity both exist and belong to the user.
  // We can do this by checking them individually.
  const { error: noteError } = await supabase
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (noteError) {
    throw new Error("Note not found or you do not have permission to access it.");
  }

  const { error: entityError } = await supabase
    .from("entities")
    .select("id")
    .eq("id", entityId)
    .eq("user_id", userId)
    .single();

  if (entityError) {
    throw new Error("Entity not found or you do not have permission to access it.");
  }

  // 2. Check if the association already exists to prevent duplicates.
  const { data: existingLink, error: linkCheckError } = await supabase
    .from("note_entities")
    .select()
    .eq("note_id", noteId)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (linkCheckError) {
    console.error("Error checking for existing note-entity link:", linkCheckError);
    throw new Error("Failed to check for existing association.");
  }

  if (existingLink) {
    throw new Error("This entity is already associated with the note.");
  }

  // 3. Insert the new association with relationship type.
  const { data: newAssociation, error: insertError } = await supabase
    .from("note_entities")
    .insert({
      note_id: noteId,
      entity_id: entityId,
      type: (relationshipType || "is_related_to"),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating note-entity association:", insertError);
    throw new Error("Failed to create the association.");
  }

  return newAssociation;
}

export async function findNoteById(
  supabase: SupabaseClient,
  noteId: string,
  userId: string
): Promise<NoteDTO | null> {
  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      note_entities(
        type,
        entities(id, name, type, description)
      )
    `)
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (error) {
    const NO_ROWS_FOUND_CODE = "PGRST116";
    // If no note matches the given ID and user, return null as a non-exceptional case
    if (error.code === NO_ROWS_FOUND_CODE) {
      return null;
    }
    console.error("Error fetching note by ID:", error);
    throw new Error("Failed to fetch note from the database.");
  }

  // Transform the response to match NoteDTO format with relationship_type
  const transformedNote = {
    ...data,
    entities: (data.note_entities || []).map((ne: any) => ({
      ...ne.entities,
      relationship_type: ne.type,
    })),
    note_entities: undefined,
  };

  return transformedNote;
}