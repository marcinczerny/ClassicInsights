import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password are required" }), {
      status: 400,
    });
  }

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/login`,
    },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  console.log("Registration response:", data); // Debug log

  // Check if email confirmation is enabled
  const needsConfirmation = !data.session && data.user && !data.user.email_confirmed_at;

  return new Response(
    JSON.stringify({
      user: data.user,
      session: data.session,
      message: needsConfirmation
        ? "Rejestracja zakończona pomyślnie. Sprawdź swoją skrzynkę email i potwierdź konto, aby móc się zalogować."
        : "Rejestracja zakończona pomyślnie. Możesz się teraz zalogować.",
    }),
    {
      status: 200,
    }
  );
};
