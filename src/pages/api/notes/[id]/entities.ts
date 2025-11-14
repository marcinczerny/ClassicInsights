import type { APIRoute } from "astro";
import { addEntityToNoteSchema, getNoteSchema } from "@/lib/validation";
import { addEntityToNote } from "@/lib/services/notes.service";
import { handleServiceError, createErrorResponse } from "@/lib/errors";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const userId = user.id;

  // 1. Validate URL parameter (noteId)
  const paramsValidation = getNoteSchema.safeParse(params);
  if (!paramsValidation.success) {
    return createErrorResponse("VALIDATION_ERROR", "Invalid note ID", 400, paramsValidation.error.errors);
  }
  const { id: noteId } = paramsValidation.data;

  try {
    // 2. Validate request body (entity_id and optional relationship_type)
    const body = await request.json();
    const bodyValidation = addEntityToNoteSchema.safeParse(body);
    if (!bodyValidation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Invalid request body", 400, bodyValidation.error.errors);
    }
    const { entity_id: entityId, relationship_type } = bodyValidation.data;

    // 3. Call the service to create the association with relationship type
    const newAssociation = await addEntityToNote(supabase, noteId, entityId, userId, relationship_type);

    return new Response(JSON.stringify(newAssociation), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};
