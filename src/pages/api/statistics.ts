import { getStatistics } from "@/lib/services/statistics.service";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const statistics = await getStatistics(user.id);
    return new Response(JSON.stringify(statistics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
