import type { APIRoute } from "astro";
import { getNoteSchema, updateNoteSchema } from "@/lib/validation";
import { findNoteById, updateNote, deleteNote } from "@/lib/services/notes.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { handleServiceError, createErrorResponse, createNotFoundResponse } from "@/lib/errors";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  // TODO: Replace with actual authentication
  // const session = await locals.supabase.auth.getSession();
  // if (!session.data.session) {
  //   return createUnauthorizedResponse();
  // }
  // const userId = session.data.session.user.id;
  const userId = DEFAULT_USER_ID;

  const validationResult = getNoteSchema.safeParse(params);

  if (!validationResult.success) {
    return createErrorResponse(
      "VALIDATION_ERROR",
      "Invalid note ID",
      400,
      validationResult.error.errors
    );
  }

  const { id: noteId } = validationResult.data;

  try {
    const note = await findNoteById(locals.supabase, noteId, userId);

    if (!note) {
      return createNotFoundResponse("Note");
    }

    return new Response(JSON.stringify(note), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // TODO: Replace with actual authentication
  // const session = await locals.supabase.auth.getSession();
  // if (!session.data.session) {
  //   return createUnauthorizedResponse();
  // }
  // const userId = session.data.session.user.id;
  const userId = DEFAULT_USER_ID;

  // 1. Validate URL parameter
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
    // 2. Validate request body
    const body = await request.json();
    const bodyValidation = updateNoteSchema.safeParse(body);
    if (!bodyValidation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid request body",
        400,
        bodyValidation.error.errors
      );
    }

    // 3. Call the service to update the note
    const updatedNote = await updateNote(locals.supabase, noteId, userId, bodyValidation.data);
    return new Response(JSON.stringify(updatedNote), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  // TODO: Replace with actual authentication
  // const session = await locals.supabase.auth.getSession();
  // if (!session.data.session) {
  //   return createUnauthorizedResponse();
  // }
  // const userId = session.data.session.user.id;
  const userId = DEFAULT_USER_ID;

  const validationResult = getNoteSchema.safeParse(params);

  if (!validationResult.success) {
    return createErrorResponse(
      "VALIDATION_ERROR",
      "Invalid note ID",
      400,
      validationResult.error.errors
    );
  }

  const { id: noteId } = validationResult.data;

  try {
    // First, verify the note exists and belongs to the user to return a 404 if not found.
    const note = await findNoteById(locals.supabase, noteId, userId);
    if (!note) {
      return createNotFoundResponse("Note");
    }

    await deleteNote(locals.supabase, noteId, userId);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleServiceError(error);
  }
};
