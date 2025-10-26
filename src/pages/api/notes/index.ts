import type { APIRoute } from "astro";
import { createNoteSchema, getNotesSchema } from "@/lib/validation";
import { createNote, getNotes } from "@/lib/services/notes.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { handleServiceError, createErrorResponse } from "@/lib/errors";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  // TODO: Replace with actual authentication
  // const session = await locals.supabase.auth.getSession();
  // if (!session.data.session) {
  //   return createUnauthorizedResponse();
  // }
  // const userId = session.data.session.user.id;
  const userId = DEFAULT_USER_ID;

  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  const validationResult = getNotesSchema.safeParse(queryParams);

  if (!validationResult.success) {
    return createErrorResponse(
      "VALIDATION_ERROR",
      "Invalid query parameters",
      400,
      validationResult.error.errors
    );
  }

  try {
    const notesData = await getNotes(locals.supabase, userId, validationResult.data);
    return new Response(JSON.stringify(notesData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  // TODO: Replace with actual authentication
  // const session = await locals.supabase.auth.getSession();
  // if (!session.data.session) {
  //   return createUnauthorizedResponse();
  // }
  // const userId = session.data.session.user.id;
  const userId = DEFAULT_USER_ID;

  try {
    const body = await request.json();
    const validationResult = createNoteSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid request body",
        400,
        validationResult.error.errors
      );
    }

    const newNote = await createNote(locals.supabase, userId, validationResult.data);
    return new Response(JSON.stringify(newNote), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};
