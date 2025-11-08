import { updateSuggestionStatus } from '@/lib/services/suggestions.service';
import { suggestionStatusUpdateSchema } from '@/lib/validation';
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const suggestionId = params.id;
  if (!suggestionId) {
    return new Response(JSON.stringify({ error: 'Suggestion ID is required' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const validatedData = suggestionStatusUpdateSchema.parse(body);

    const updatedSuggestion = await updateSuggestionStatus(
      user.id,
      suggestionId,
      validatedData.status,
    );

    return new Response(JSON.stringify(updatedSuggestion), {
      status: 200,
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
