import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateNoteCommand, NoteDTO, NotesListResponseDTO } from "@/types";
import type { GetNotesParams } from "../validation";

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
  if (entity_ids && entity_ids.length > 0) {
    const { data: entities, error: entityError } = await supabase
      .from("entities")
      .select("id")
      .in("id", entity_ids)
      .eq("user_id", userId);

    if (entityError) {
      console.error("Error verifying entities:", entityError);
      throw new Error("Failed to verify entities.");
    }

    if (entities.length !== entity_ids.length) {
      throw new Error("One or more entities not found or do not belong to the user.");
    }
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
