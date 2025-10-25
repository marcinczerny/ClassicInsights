import type { APIRoute } from "astro";
import { addEntityToNoteSchema } from "@/lib/validation";
import { getNoteSchema } from "@/lib/validation";
import { addEntityToNote } from "@/lib/services/notes.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  const userId = DEFAULT_USER_ID; // TODO: Replace with actual user session

  // 1. Validate URL parameter (noteId)
  const paramsValidation = getNoteSchema.safeParse(params);
  if (!paramsValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid note ID.",
          details: paramsValidation.error.format(),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const { id: noteId } = paramsValidation.data;

  // 2. Validate request body (entity_id)
  const body = await request.json();
  const bodyValidation = addEntityToNoteSchema.safeParse(body);
  if (!bodyValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body.",
          details: bodyValidation.error.format(),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const { entity_id: entityId } = bodyValidation.data;

  // 3. Call the service to create the association
  try {
    const newAssociation = await addEntityToNote(locals.supabase, noteId, entityId, userId);
    return new Response(JSON.stringify(newAssociation), {
      status: 201, // 201 Created
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error); // TODO: Add proper error logging
    
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";

    if (errorMessage.includes("not found")) {
      statusCode = 404;
      errorCode = "NOT_FOUND";
    } else if (errorMessage.includes("already associated")) {
      statusCode = 409; // 409 Conflict
      errorCode = "CONFLICT";
    }

    return new Response(
      JSON.stringify({
        error: { code: errorCode, message: errorMessage },
      }),
      { status: statusCode, headers: { "Content-Type": "application/json" } },
    );
  }
};
