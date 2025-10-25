import type { APIRoute } from "astro";
import { getNoteSchema } from "@/lib/validation";
import { findNoteById } from "@/lib/services/notes.service";
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
