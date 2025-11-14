import { deleteNote, findNoteById, updateNote } from "@/lib/services/notes.service";
import { updateNoteSchema } from "@/lib/validation";
import type { APIRoute } from "astro";
import { z } from "zod";

export const GET: APIRoute = async ({ params, locals }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const noteId = params.id;
  if (!noteId) {
    return new Response(JSON.stringify({ error: "Note ID is required" }), { status: 400 });
  }

  try {
    const note = await findNoteById(supabase, noteId, user.id);
    if (!note) {
      return new Response(JSON.stringify({ error: "Note not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(note), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const noteId = params.id;
  if (!noteId) {
    return new Response(JSON.stringify({ error: "Note ID is required" }), { status: 400 });
  }

  try {
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    const updatedNote = await updateNote(supabase, noteId, user.id, validatedData);

    return new Response(JSON.stringify(updatedNote), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input", details: error.errors }), {
        status: 400,
      });
    }
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const noteId = params.id;
  if (!noteId) {
    return new Response(JSON.stringify({ error: "Note ID is required" }), { status: 400 });
  }

  try {
    await deleteNote(supabase, noteId, user.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
