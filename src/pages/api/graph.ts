import { getGraphData } from "@/lib/services/graph.service";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, url }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const centerNodeId = url.searchParams.get("centerNodeId");
    const graphData = await getGraphData(supabase, user.id, centerNodeId);
    return new Response(JSON.stringify(graphData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
