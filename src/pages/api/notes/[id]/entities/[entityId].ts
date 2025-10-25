import type { APIRoute } from "astro";
import { removeEntityFromNoteSchema } from "@/lib/validation";
import { removeEntityFromNote } from "@/lib/services/notes.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  const userId = DEFAULT_USER_ID; // TODO: Replace with actual user session

  // 1. Validate URL parameters (noteId and entityId)
  const validationResult = removeEntityFromNoteSchema.safeParse(params);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid Note or Entity ID.",
          details: validationResult.error.format(),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  
  const { id: noteId, entityId } = validationResult.data;

  // 2. Call the service to remove the association
  try {
    await removeEntityFromNote(locals.supabase, noteId, entityId, userId);

    return new Response(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error(error); // TODO: Add proper error logging
    
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";

    if (errorMessage.includes("not found")) {
      statusCode = 404;
      errorCode = "NOT_FOUND";
    }

    return new Response(
      JSON.stringify({
        error: { code: errorCode, message: errorMessage },
      }),
      { status: statusCode, headers: { "Content-Type": "application/json" } },
    );
  }
};
