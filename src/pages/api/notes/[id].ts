import type { APIRoute } from "astro";
import { getNoteSchema, updateNoteSchema } from "@/lib/validation";
import { findNoteById, updateNote, deleteNote } from "@/lib/services/notes.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const userId = DEFAULT_USER_ID; // TODO: Replace with actual user session

  const validationResult = getNoteSchema.safeParse(params);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid note ID.",
          details: validationResult.error.format(),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { id: noteId } = validationResult.data;

  try {
    const note = await findNoteById(locals.supabase, noteId, userId);

    if (!note) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Note not found or you do not have permission to view it.",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(note), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error); // TODO: Add proper error logging
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const userId = DEFAULT_USER_ID; // TODO: Replace with actual user session

  // 1. Validate URL parameter
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

  // 2. Validate request body
  const body = await request.json();
  const bodyValidation = updateNoteSchema.safeParse(body);
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

  // 3. Call the service to update the note
  try {
    const updatedNote = await updateNote(locals.supabase, noteId, userId, bodyValidation.data);
    return new Response(JSON.stringify(updatedNote), {
      status: 200,
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
    } else if (errorMessage.includes("belong to the user")) {
      statusCode = 403;
      errorCode = "FORBIDDEN"
    } else if (errorMessage.includes("already exists")) {
      statusCode = 409;
      errorCode = "CONFLICT"
    } else if (errorMessage.includes("Failed to verify entities")) {
      statusCode = 400;
      errorCode = "VALIDATION_ERROR";
    }

    return new Response(
      JSON.stringify({
        error: { code: errorCode, message: errorMessage },
      }),
      { status: statusCode, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const userId = DEFAULT_USER_ID; // TODO: Replace with actual user session

  const validationResult = getNoteSchema.safeParse(params);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid note ID.",
          details: validationResult.error.format(),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  
  const { id: noteId } = validationResult.data;

  try {
    // First, verify the note exists and belongs to the user to return a 404 if not found.
    const note = await findNoteById(locals.supabase, noteId, userId);
    if (!note) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Note not found or you do not have permission to delete it.",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    await deleteNote(locals.supabase, noteId, userId);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error); // TODO: Add proper error logging
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while deleting the note.",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
