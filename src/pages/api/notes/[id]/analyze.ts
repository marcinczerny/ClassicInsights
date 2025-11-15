import { generateSuggestionsForNote } from "@/lib/services/suggestions.service";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ params, locals }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const noteId = params.id;
  if (!noteId) {
    return new Response(JSON.stringify({ error: "Note ID is required" }), { status: 400 });
  }

  try {
    const openRouterApiKey = locals.runtime?.env?.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is not set.");
    }
    const suggestions = await generateSuggestionsForNote(
      supabase,
      noteId,
      user.id,
      openRouterApiKey
    );
    return new Response(JSON.stringify(suggestions), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
