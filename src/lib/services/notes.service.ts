import type { SupabaseClient } from "@/db/supabase.client";
import type { NotesListResponseDTO } from "@/types";
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
