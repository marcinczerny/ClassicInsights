import type { APIRoute } from "astro";
import { removeEntityFromNoteSchema } from "@/lib/validation";
import { removeEntityFromNote } from "@/lib/services/notes.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { handleServiceError, createErrorResponse } from "@/lib/errors";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  // TODO: Replace with actual authentication
  // const session = await locals.supabase.auth.getSession();
  // if (!session.data.session) {
  //   return createUnauthorizedResponse();
  // }
  // const userId = session.data.session.user.id;
  const userId = DEFAULT_USER_ID;

  // 1. Validate URL parameters (noteId and entityId)
  const validationResult = removeEntityFromNoteSchema.safeParse(params);

  if (!validationResult.success) {
    return createErrorResponse(
      "VALIDATION_ERROR",
      "Invalid note or entity ID",
      400,
      validationResult.error.errors
    );
  }

  const { id: noteId, entityId } = validationResult.data;

  // 2. Call the service to remove the association
  try {
    await removeEntityFromNote(locals.supabase, noteId, entityId, userId);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleServiceError(error);
  }
};
