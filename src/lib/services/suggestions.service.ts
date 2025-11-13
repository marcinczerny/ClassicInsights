import { supabaseClient, handleSupabaseError } from "@/db/supabase.client";
import type { SuggestionDTO } from "@/types";
import type { Enums } from "@/db/database.types";
import { z } from "zod";
import { getProfile } from "./profile.service";
import { findNoteById, addEntityToNote, updateNote } from "./notes.service";
import { createEntity, findEntityByName, getEntities } from "./entities.service";
import { OpenRouterService } from "./ai.service";

const MIN_CONTENT_LENGTH = 10;

const AISuggestionSchema = z.object({
  type: z.enum(["quote", "summary", "new_entity", "existing_entity_link"]),
  name: z.string(),
  content: z.string(),
  suggested_entity_id: z.string().uuid().nullable(),
  entity_type: z.enum(["person", "work", "epoch", "idea", "school", "system", "other"]).nullable().optional(),
});

const AISuggestionsResponseSchema = z.object({
  suggestions: z.array(AISuggestionSchema),
});

async function generateSuggestionsFromAI(
  userId: string,
  noteContent: string,
  noteEntities: { id: string; name: string; type: Enums<"entity_type">; description: string | null }[]
): Promise<z.infer<typeof AISuggestionsResponseSchema>["suggestions"]> {
  const userEntities = await getEntities(userId);

  const existingEntitiesContext =
    userEntities.length > 0
      ? userEntities.map((e) => `- ID: ${e.id} | Name: "${e.name}" | Type: ${e.type}`).join("\n")
      : "No existing entities.";

  const noteEntitiesContext =
    noteEntities.length > 0
      ? noteEntities.map((e) => `- ${e.name} (${e.type})`).join("\n")
      : "No entities linked to this note yet.";

  const systemPrompt = `You are an expert assistant. Generate 2-5 helpful suggestions based on the note content. Types can be 'quote', 'summary', 'new_entity', or 'existing_entity_link'. For 'existing_entity_link', you MUST use the provided UUID for 'suggested_entity_id'. For all other types, 'suggested_entity_id' MUST be null.`;

  const userPrompt = `**Note Content:**\n${noteContent}\n\n**Entities already linked:**\n${noteEntitiesContext}\n\n**User's existing entities (for linking):**\n${existingEntitiesContext}\n\nGenerate suggestions.`;

  const aiService = new OpenRouterService();
  const response = await aiService.getStructuredResponse({
    systemPrompt,
    userPrompt,
    schema: AISuggestionsResponseSchema,
  });
  return response.suggestions;
}

export async function generateSuggestionsForNote(noteId: string, userId: string): Promise<SuggestionDTO[]> {
  const profile = await getProfile(userId);
  if (!profile?.has_agreed_to_ai_data_processing) {
    throw new Error("User has not agreed to AI data processing.");
  }

  const note = await findNoteById(noteId, userId);
  if (!note || note.user_id !== userId) {
    throw new Error("Note not found or access denied.");
  }

  const noteContent = note.content || "";
  if (noteContent.length < MIN_CONTENT_LENGTH) {
    throw new Error(`Note content must be at least ${MIN_CONTENT_LENGTH} characters long.`);
  }

  const aiSuggestions = await generateSuggestionsFromAI(userId, noteContent, note.entities || []);

  const suggestionsToInsert = aiSuggestions.map((suggestion) => ({
    user_id: userId,
    note_id: noteId,
    type: suggestion.type,
    status: "pending" as const,
    name: suggestion.name,
    content: suggestion.content,
    suggested_entity_id: suggestion.suggested_entity_id,
  }));

  const { data: savedSuggestions, error } = await supabaseClient
    .from("ai_suggestions")
    .insert(suggestionsToInsert)
    .select();

  if (error) {
    handleSupabaseError(error);
  }

  return savedSuggestions || [];
}

export async function getSuggestionsForNote(
  noteId: string,
  userId: string,
  status?: Enums<"suggestion_status"> | Enums<"suggestion_status">[]
): Promise<SuggestionDTO[]> {
  let query = supabaseClient.from("ai_suggestions").select("*").eq("note_id", noteId).eq("user_id", userId);

  if (status) {
    if (Array.isArray(status)) {
      query = query.in("status", status);
    } else {
      query = query.eq("status", status);
    }
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    handleSupabaseError(error);
  }

  return data || [];
}

async function executeAcceptanceLogic(suggestion: SuggestionDTO, userId: string): Promise<void> {
  const noteId = suggestion.note_id;
  if (!noteId) throw new Error("Suggestion has no associated note");

  const note = await findNoteById(noteId, userId);
  if (!note) throw new Error("Note not found");

  switch (suggestion.type) {
    case "new_entity": {
      if (!suggestion.name) throw new Error("Suggestion name is required for new_entity");

      const entityName = suggestion.name.includes(":") ? suggestion.name.split(":")[1].trim() : suggestion.name;

      let entity = await findEntityByName(userId, entityName);

      if (!entity) {
        entity = await createEntity(userId, {
          name: entityName,
          type: "person", // Default type
          description: suggestion.content || "",
        });
      }

      if (!entity) {
        throw new Error("Failed to create or find entity");
      }

      const isAlreadyLinked = note.entities.some((e) => e.id === entity.id);
      if (!isAlreadyLinked) {
        await addEntityToNote(noteId, entity.id, userId, "is_related_to");
      }
      break;
    }
    case "existing_entity_link": {
      if (!suggestion.suggested_entity_id) throw new Error("No entity ID provided");

      const isAlreadyLinked = note.entities.some((e) => e.id === suggestion.suggested_entity_id);
      if (!isAlreadyLinked) {
        await addEntityToNote(noteId, suggestion.suggested_entity_id, userId, "is_related_to");
      }
      break;
    }
    case "quote":
    case "summary": {
      const header = suggestion.type === "quote" ? "## Quotes" : "## Summary";
      const newContent = `${note.content || ""}\n\n${header}\n\n${suggestion.content}`;
      await updateNote(noteId, userId, { content: newContent });
      break;
    }
  }
}

export async function updateSuggestionStatus(
  userId: string,
  suggestionId: string,
  newStatus: "accepted" | "rejected"
): Promise<SuggestionDTO> {
  const { data: suggestion, error: fetchError } = await supabaseClient
    .from("ai_suggestions")
    .select("*")
    .eq("id", suggestionId)
    .single();

  if (fetchError || !suggestion || suggestion.user_id !== userId) {
    throw new Error("Suggestion not found or access denied");
  }

  if (suggestion.status !== "pending") {
    throw new Error("Only pending suggestions can be updated.");
  }

  const { data: updatedSuggestion, error: updateError } = await supabaseClient
    .from("ai_suggestions")
    .update({ status: newStatus })
    .eq("id", suggestionId)
    .select()
    .single();

  if (updateError || !updatedSuggestion) {
    throw new Error("Failed to update suggestion status");
  }

  if (newStatus === "accepted") {
    await executeAcceptanceLogic(suggestion, userId);
  }

  return updatedSuggestion;
}
