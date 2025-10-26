import type { APIRoute } from "astro";
import { addEntityToNoteSchema, getNoteSchema } from "@/lib/validation";
import { addEntityToNote } from "@/lib/services/notes.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { handleServiceError, createErrorResponse } from "@/lib/errors";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  // TODO: Replace with actual authentication
  // const session = await locals.supabase.auth.getSession();
  // if (!session.data.session) {
  //   return createUnauthorizedResponse();
  // }
  // const userId = session.data.session.user.id;
  const userId = DEFAULT_USER_ID;

  // 1. Validate URL parameter (noteId)
  const paramsValidation = getNoteSchema.safeParse(params);
  if (!paramsValidation.success) {
    return createErrorResponse(
      "VALIDATION_ERROR",
      "Invalid note ID",
      400,
      paramsValidation.error.errors
    );
  }
  const { id: noteId } = paramsValidation.data;

  try {
    // 2. Validate request body (entity_id and optional relationship_type)
    const body = await request.json();
    const bodyValidation = addEntityToNoteSchema.safeParse(body);
    if (!bodyValidation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid request body",
        400,
        bodyValidation.error.errors
      );
    }
    const { entity_id: entityId, relationship_type } = bodyValidation.data;

    // 3. Call the service to create the association with relationship type
    const newAssociation = await addEntityToNote(
      locals.supabase,
      noteId,
      entityId,
      userId,
      relationship_type
    );

    return new Response(JSON.stringify(newAssociation), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};
