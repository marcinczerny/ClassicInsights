import { createNote, getNotes } from '@/lib/services/notes.service';
import { createNoteSchema } from '@/lib/validation';
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const GET: APIRoute = async ({ locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const notes = await getNotes(user.id);
    return new Response(JSON.stringify(notes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    const newNote = await createNote(user.id, validatedData);

    return new Response(JSON.stringify(newNote), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), {
        status: 400,
      });
    }
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
