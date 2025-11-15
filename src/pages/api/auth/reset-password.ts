import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";

const ResetPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export const POST: APIRoute = async ({ request, url, cookies, locals }) => {
  try {
    const body = await request.json();
    const result = ResetPasswordSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return new Response(JSON.stringify({ error: "Invalid email address.", details: errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      runtime: locals.runtime,
    });

    const { email } = result.data;

    const redirectTo = `${url.origin}/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      // Log the actual error for debugging, but don't expose it to the client.
      console.error("Supabase reset password error:", error.message);
    }

    // Always return a generic success message to prevent user enumeration.
    return new Response(
      JSON.stringify({
        message: "If an account with this email exists, a password reset link has been sent.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Reset password endpoint error:", error);
    // Even in case of unexpected errors, return the generic success message.
    return new Response(
      JSON.stringify({
        message: "If an account with this email exists, a password reset link has been sent.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
