import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";

const UpdatePasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
});

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();
    const result = UpdatePasswordSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return new Response(JSON.stringify({ error: "Invalid password.", details: errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      runtime: locals.runtime,
    });

    // The user's session should be active from the recovery link
    const { error } = await supabase.auth.updateUser({
      password: result.data.password,
    });

    if (error) {
      console.error("Supabase update user error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to update password. The link may have expired." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // It's a good practice to sign the user out after a password change
    await supabase.auth.signOut();

    return new Response(JSON.stringify({ message: "Password updated successfully." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update password endpoint error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
