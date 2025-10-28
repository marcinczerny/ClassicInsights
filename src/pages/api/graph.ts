import type { APIRoute } from "astro";
import { z } from "zod";
import { graphService } from "../../lib/services/graph.service";
import {
  createValidationErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createInternalErrorResponse
} from "../../lib/errors";
import { NotFoundError, ForbiddenError } from "../../lib/errors/api-errors";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { graphQuerySchema } from "../../lib/validation/graph.validation";

export const prerender = false;

/**
 * GET /api/graph
 * Returns a visualization graph of nodes (entities and notes) and edges (relationships and note-entity associations)
 * centered around a specified node with configurable depth levels
 *
 * Query Parameters:
 * - center_id (required): UUID of the central node (entity or note)
 * - center_type (required): Type of the central node ("entity" or "note")
 * - levels (optional): Number of graph levels from center (1-3, default: 2)
 *
 * @returns 200 - Graph data with nodes and edges
 * @returns 400 - Validation error (invalid parameters)
 * @returns 401 - User not authenticated
 * @returns 403 - Center node does not belong to user
 * @returns 404 - Center node not found
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async (context) => {
  const { url, locals } = context;
  const supabase = locals.supabase;

  // TODO: Replace with actual authentication when implemented
  // const user = locals.user;
  // if (!user) {
  //   return createUnauthorizedResponse();
  // }
  // const userId = user.id;

  // Temporary: Use DEFAULT_USER_ID for development
  const userId = DEFAULT_USER_ID;

  try {
    // Validate query parameters
    const params = graphQuerySchema.parse({
      center_id: url.searchParams.get("center_id"),
      center_type: url.searchParams.get("center_type"),
      levels: url.searchParams.get("levels")
    });

    // Get graph from service
    const graph = await graphService.getGraph(supabase, userId, params);

    return new Response(JSON.stringify(graph), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error);
    }

    // Handle custom application errors
    if (error instanceof NotFoundError) {
      return createNotFoundResponse(error.message);
    }

    if (error instanceof ForbiddenError) {
      return createForbiddenResponse(error.message);
    }

    // Log unexpected errors
    console.error("Unexpected error in GET /api/graph:", error);
    return createInternalErrorResponse();
  }
};
