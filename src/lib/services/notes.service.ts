import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateNoteCommand, NoteDTO, NotesListResponseDTO, UpdateNoteCommand } from "@/types";
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
    .select("*, entities(*)", { count: "exact" })
    .eq("user_id", userId);

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
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
    // TODO: Add proper error handling/logging
    console.error("Error fetching notes:", error);
    throw new Error("Failed to fetch notes from the database.");
  }

  const total = count ?? 0;
  const total_pages = Math.ceil(total / limit);

  return {
    data: data || [],
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
  const { title, content, entity_ids } = command;

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

  // 2. Verify entity ownership if entity_ids are provided
  if (entity_ids) {
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

  // 4. Link entities to the new note
  if (entity_ids && entity_ids.length > 0) {
    const noteEntityLinks = entity_ids.map((entity_id) => ({
      note_id: newNote.id,
      entity_id,
    }));

    const { error: linkError } = await supabase
      .from("note_entities")
      .insert(noteEntityLinks);

    if (linkError) {
      console.error("Error linking entities to note:", linkError);
      // TODO: Implement transaction to roll back note creation
      throw new Error("Failed to link entities to the note.");
    }
  }

  // 5. Fetch and return the complete note DTO
  const { data: fullNote, error: fetchError } = await supabase
    .from("notes")
    .select("*, entities(*)")
    .eq("id", newNote.id)
    .single();
  
  if (fetchError) {
    console.error("Error fetching created note:", fetchError);
    throw new Error("Failed to fetch the created note.");
  }

  return fullNote;
}

export async function updateNote(
  supabase: SupabaseClient,
  noteId: string,
  userId: string,
  command: UpdateNoteCommand,
): Promise<NoteDTO> {
  const { title, content, entity_ids } = command;

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
  
  // 3. Verify entity ownership if entity_ids are provided
  if (entity_ids) {
    await _validateEntities(supabase, entity_ids, userId);
  }

  // 4. Update the note and its entity associations in a transaction
  // Supabase SDK doesn't directly support transactions in edge functions.
  // We will perform operations sequentially and handle potential inconsistencies.
  // A robust implementation would use a database function (RPC).

  // 4a. Update note details
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

  // 4b. Update entity links if provided
  if (entity_ids) {
    // Delete existing links
    const { error: deleteError } = await supabase
      .from("note_entities")
      .delete()
      .eq("note_id", noteId);

    if (deleteError) {
      console.error("Error removing old entity links:", deleteError);
      throw new Error("Failed to update entity links (delete step).");
    }

    // Insert new links
    if (entity_ids.length > 0) {
      const newLinks = entity_ids.map((entity_id) => ({
        note_id: noteId,
        entity_id: entity_id,
      }));
      const { error: insertError } = await supabase.from("note_entities").insert(newLinks);

      if (insertError) {
        console.error("Error adding new entity links:", insertError);
        throw new Error("Failed to update entity links (insert step).");
      }
    }
  }

  // 5. Fetch and return the updated note DTO
  const { data: updatedNote, error: finalFetchError } = await supabase
    .from("notes")
    .select("*, entities(*)")
    .eq("id", noteId)
    .single();

  if (finalFetchError) {
    console.error("Error fetching updated note:", finalFetchError);
    throw new Error("Failed to fetch the updated note.");
  }

  return updatedNote;
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
  if (entityIdsToCheck.length > 0) {
    // For each entity, check if it's linked to any other notes
    const { data: remainingLinks, error: linksCheckError } = await supabase
      .from("note_entities")
      .select("entity_id")
      .in("entity_id", entityIdsToCheck);

    if (linksCheckError) {
      console.error("Error checking for remaining entity links:", linksCheckError);
      // Note: The primary note was deleted, but cleanup failed. This is a partial success state.
      // A transactional approach (e.g., RPC) would be more robust.
      throw new Error("Failed to check for orphan entities after note deletion.");
    }
    
    const linkedEntityIds = new Set(remainingLinks.map(link => link.entity_id));
    const orphanEntityIds = entityIdsToCheck.filter(id => !linkedEntityIds.has(id));

    if (orphanEntityIds.length > 0) {
      const { error: orphanDeleteError } = await supabase
        .from("entities")
        .delete()
        .in("id", orphanEntityIds);

      if (orphanDeleteError) {
        console.error("Error deleting orphan entities:", orphanDeleteError);
        // Similar to the above, this is a partial failure state.
        throw new Error("Failed to delete orphan entities.");
      }
    }
  }
}

export async function findNoteById(
  supabase: SupabaseClient,
  noteId: string,
  userId: string
): Promise<NoteDTO | null> {
  const { data, error } = await supabase
    .from("notes")
    .select("*, entities(*)")
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (error) {
    const NO_ROWS_FOUND_CODE = "PGRST116";
    // If no note matches the given ID and user, return null as a non-exceptional case
    if (error.code === NO_ROWS_FOUND_CODE) {
      return null;
    }
    // TODO: Add proper error logging
    console.error("Error fetching note by ID:", error);
    throw new Error("Failed to fetch note from the database.");
  }

  return data;
}