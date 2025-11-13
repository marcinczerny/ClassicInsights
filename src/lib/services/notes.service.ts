import { supabaseClient } from "@/db/supabase.client";
import type { CreateNoteCommand, NoteDTO, UpdateNoteCommand, NoteEntityAssociationDTO, PaginationDTO } from "@/types";
import type { GetNotesParams } from "@/lib/validation";
import type { NotesListResponseDTO } from "@/types";

async function _validateEntities(entityIds: string[], userId: string): Promise<void> {
  if (!entityIds || entityIds.length === 0) {
    return;
  }

  const { data: entities, error: entityError } = await supabaseClient
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

export async function getNotes(userId: string, params: Partial<GetNotesParams> = {}): Promise<NotesListResponseDTO> {
  const { page = 1, limit = 20, sort = "created_at", order = "desc", entities: entityFilter, search } = params;

  // First, get total count for pagination
  let countQuery = supabaseClient.from("notes").select("id", { count: "exact", head: true }).eq("user_id", userId);

  // Apply entity filter to count if provided
  if (entityFilter && entityFilter.length > 0) {
    const { data: noteIds } = await supabaseClient
      .from("note_entities")
      .select("note_id")
      .in("entity_id", entityFilter);
    const filteredNoteIds = noteIds?.map((ne) => ne.note_id) || [];
    countQuery = countQuery.in("id", filteredNoteIds);
  }

  // Apply search filter to count if provided
  if (search) {
    countQuery = countQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error("Error counting notes:", countError);
    throw new Error("Failed to count notes.");
  }

  const total = count || 0;
  const total_pages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Build the main query
  let query = supabaseClient
    .from("notes")
    .select(
      `
      *,
      note_entities(
        type,
        entities(id, name, type, description)
      )
    `,
      { count: "exact" }
    )
    .eq("user_id", userId)
    .range(offset, offset + limit - 1);

  // Apply sorting
  const sortOrder = order === "desc";
  if (sort === "title") {
    query = query.order("title", { ascending: !sortOrder });
  } else if (sort === "updated_at") {
    query = query.order("updated_at", { ascending: !sortOrder });
  } else {
    query = query.order("created_at", { ascending: !sortOrder });
  }

  // Apply entity filter
  if (entityFilter && entityFilter.length > 0) {
    const { data: noteIds } = await supabaseClient
      .from("note_entities")
      .select("note_id")
      .in("entity_id", entityFilter);
    const filteredNoteIds = noteIds?.map((ne) => ne.note_id) || [];
    query = query.in("id", filteredNoteIds);
  }

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notes:", error);
    throw new Error("Failed to fetch notes from the database.");
  }

  const transformedData = (data || []).map((note: any) => ({
    ...note,
    entities: (note.note_entities || []).map((ne: any) => ({
      ...ne.entities,
      relationship_type: ne.type,
    })),
    note_entities: undefined,
  }));

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

export async function createNote(userId: string, command: CreateNoteCommand): Promise<NoteDTO> {
  const { title, content, entities, entity_ids } = command;

  const { data: existingNote, error: existingNoteError } = await supabaseClient
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

  if (entities && entities.length > 0) {
    const entityIds = entities.map((e) => e.entity_id);
    await _validateEntities(entityIds, userId);
  } else if (entity_ids && entity_ids.length > 0) {
    await _validateEntities(entity_ids, userId);
  }

  const { data: newNote, error: noteError } = await supabaseClient
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

  if (entities && entities.length > 0) {
    const noteEntityLinks = entities.map((e) => ({
      note_id: newNote.id,
      entity_id: e.entity_id,
      type: e.relationship_type || ("is_related_to" as const),
    }));

    const { error: linkError } = await supabaseClient.from("note_entities").insert(noteEntityLinks);

    if (linkError) {
      console.error("Error linking entities to note:", linkError);
      throw new Error("Failed to link entities to the note.");
    }
  } else if (entity_ids && entity_ids.length > 0) {
    const noteEntityLinks = entity_ids.map((entity_id) => ({
      note_id: newNote.id,
      entity_id,
      type: "is_related_to" as const,
    }));

    const { error: linkError } = await supabaseClient.from("note_entities").insert(noteEntityLinks);

    if (linkError) {
      console.error("Error linking entities to note:", linkError);
      throw new Error("Failed to link entities to the note.");
    }
  }

  const { data: fullNote, error: fetchError } = await supabaseClient
    .from("notes")
    .select(
      `
      *,
      note_entities(
        type,
        entities(id, name, type, description)
      )
    `
    )
    .eq("id", newNote.id)
    .single();

  if (fetchError) {
    console.error("Error fetching created note:", fetchError);
    throw new Error("Failed to fetch the created note.");
  }

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

export async function updateNote(noteId: string, userId: string, command: UpdateNoteCommand): Promise<NoteDTO> {
  const { title, content, entities, entity_ids } = command;

  const { data: existingNote, error: fetchError } = await supabaseClient
    .from("notes")
    .select("id, title")
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingNote) {
    throw new Error("Note not found or you do not have permission to edit it.");
  }

  if (title && title !== existingNote.title) {
    const { data: duplicateNote, error: duplicateError } = await supabaseClient
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

  if (entities && entities.length > 0) {
    const entityIds = entities.map((e) => e.entity_id);
    await _validateEntities(entityIds, userId);
  } else if (entity_ids && entity_ids.length > 0) {
    await _validateEntities(entity_ids, userId);
  }

  if (title !== undefined || content !== undefined) {
    const { error: updateError } = await supabaseClient
      .from("notes")
      .update({ title, content: content ?? undefined })
      .eq("id", noteId);

    if (updateError) {
      console.error("Error updating note:", updateError);
      throw new Error("Failed to update the note.");
    }
  }

  if (entities !== undefined) {
    const { error: deleteError } = await supabaseClient.from("note_entities").delete().eq("note_id", noteId);

    if (deleteError) {
      console.error("Error removing old entity links:", deleteError);
      throw new Error("Failed to update entity links (delete step).");
    }

    if (entities.length > 0) {
      const newLinks = entities.map((e) => ({
        note_id: noteId,
        entity_id: e.entity_id,
        type: e.relationship_type || ("is_related_to" as const),
      }));
      const { error: insertError } = await supabaseClient.from("note_entities").insert(newLinks);

      if (insertError) {
        console.error("Error adding new entity links:", insertError);
        throw new Error("Failed to update entity links (insert step).");
      }
    }
  } else if (entity_ids !== undefined) {
    const { error: deleteError } = await supabaseClient.from("note_entities").delete().eq("note_id", noteId);

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
      const { error: insertError } = await supabaseClient.from("note_entities").insert(newLinks);

      if (insertError) {
        console.error("Error adding new entity links:", insertError);
        throw new Error("Failed to update entity links (insert step).");
      }
    }
  }

  const { data: updatedNote, error: finalFetchError } = await supabaseClient
    .from("notes")
    .select(
      `
      *,
      note_entities(
        type,
        entities(id, name, type, description)
      )
    `
    )
    .eq("id", noteId)
    .single();

  if (finalFetchError) {
    console.error("Error fetching updated note:", finalFetchError);
    throw new Error("Failed to fetch the updated note.");
  }

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

async function _handleOrphanEntities(entityIdsToCheck: string[]): Promise<void> {
  if (entityIdsToCheck.length === 0) {
    return;
  }

  const { data: remainingLinks, error: linksCheckError } = await supabaseClient
    .from("note_entities")
    .select("entity_id")
    .in("entity_id", entityIdsToCheck);

  if (linksCheckError) {
    console.error("Error checking for remaining entity links:", linksCheckError);
    throw new Error("Failed to check for orphan entities.");
  }

  const stillLinkedEntityIds = new Set(remainingLinks.map((link) => link.entity_id));
  const orphanEntityIds = entityIdsToCheck.filter((id) => !stillLinkedEntityIds.has(id));

  if (orphanEntityIds.length > 0) {
    const { error: orphanDeleteError } = await supabaseClient.from("entities").delete().in("id", orphanEntityIds);

    if (orphanDeleteError) {
      console.error("Error deleting orphan entities:", orphanDeleteError);
      throw new Error("Failed to delete orphan entities.");
    }
  }
}

export async function deleteNote(noteId: string, userId: string): Promise<void> {
  const { data: noteEntities, error: entitiesFetchError } = await supabaseClient
    .from("note_entities")
    .select("entity_id")
    .eq("note_id", noteId);

  if (entitiesFetchError) {
    console.error("Error fetching entities for note:", entitiesFetchError);
    throw new Error("Failed to fetch associated entities before deletion.");
  }

  const entityIdsToCheck = noteEntities.map((ne) => ne.entity_id);

  const { error: deleteError } = await supabaseClient.from("notes").delete().eq("id", noteId).eq("user_id", userId);

  if (deleteError) {
    console.error("Error deleting note:", deleteError);
    throw new Error("Failed to delete the note.");
  }

  await _handleOrphanEntities(entityIdsToCheck);
}

export async function removeEntityFromNote(noteId: string, entityId: string, userId: string): Promise<void> {
  const { error: noteCheckError } = await supabaseClient
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (noteCheckError) {
    throw new Error("Note not found or you do not have permission to modify it.");
  }

  const { error: deleteError } = await supabaseClient
    .from("note_entities")
    .delete()
    .eq("note_id", noteId)
    .eq("entity_id", entityId);

  if (deleteError) {
    console.error("Error removing entity association:", deleteError);
    throw new Error("Failed to remove entity from note.");
  }

  await _handleOrphanEntities([entityId]);
}

export async function addEntityToNote(
  noteId: string,
  entityId: string,
  userId: string,
  relationshipType?: "criticizes" | "is_student_of" | "expands_on" | "influenced_by" | "is_example_of" | "is_related_to"
): Promise<NoteEntityAssociationDTO> {
  const { error: noteError } = await supabaseClient
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (noteError) {
    throw new Error("Note not found or you do not have permission to access it.");
  }

  const { error: entityError } = await supabaseClient
    .from("entities")
    .select("id")
    .eq("id", entityId)
    .eq("user_id", userId)
    .single();

  if (entityError) {
    throw new Error("Entity not found or you do not have permission to access it.");
  }

  const { data: existingLink, error: linkCheckError } = await supabaseClient
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

  const { data: newAssociation, error: insertError } = await supabaseClient
    .from("note_entities")
    .insert({
      note_id: noteId,
      entity_id: entityId,
      type: relationshipType || "is_related_to",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating note-entity association:", insertError);
    throw new Error("Failed to create the association.");
  }

  return newAssociation;
}

export async function findNoteById(noteId: string, userId: string): Promise<NoteDTO | null> {
  const { data, error } = await supabaseClient
    .from("notes")
    .select(
      `
      *,
      note_entities(
        type,
        entities(id, name, type, description)
      )
    `
    )
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (error) {
    const NO_ROWS_FOUND_CODE = "PGRST116";
    if (error.code === NO_ROWS_FOUND_CODE) {
      return null;
    }
    console.error("Error fetching note by ID:", error);
    throw new Error("Failed to fetch note from the database.");
  }

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
