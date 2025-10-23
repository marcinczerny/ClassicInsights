import type { APIRoute } from "astro";
import { getNotesSchema } from "@/lib/validation";
import { getNotes } from "@/lib/services/notes.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  // const session = await locals.supabase.auth.getSession();
  // if (!session.data.session) {
  //   return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "User is not authenticated." } }), {
  //     status: 401,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }
  // const userId = session.data.session.user.id;
  const userId = DEFAULT_USER_ID;

  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  const validationResult = getNotesSchema.safeParse(queryParams);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters.",
          details: validationResult.error.format(),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const notesData = await getNotes(locals.supabase, userId, validationResult.data);
    return new Response(JSON.stringify(notesData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // TODO: Add proper error logging
    console.error(error);
    return new Response(
      JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
