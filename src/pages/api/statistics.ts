import type { APIRoute } from "astro";
import { z } from "zod";
import { getUserStatistics } from "../../lib/services/statistics.service";
import {
  createValidationErrorResponse,
  createInternalErrorResponse,
} from "../../lib/errors";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { getStatisticsQuerySchema } from "../../lib/validation/statistics.validation";

export const prerender = false;

/**
 * GET /api/statistics
 * Returns comprehensive usage statistics for the authenticated user
 *
 * Provides aggregated data about:
 * - Notes (total count and created within the period)
 * - Entities (total count broken down by types)
 * - Relationships (total count broken down by types)
 * - AI suggestions (numbers generated, accepted, rejected, and acceptance rates)
 *
 * Query Parameters:
 * - period (optional): Time period for created_this_period statistics
 *   Allowed values: "all" (default), "week", "month", "year"
 *
 * @returns 200 - Statistics data with notes, entities, relationships, and AI suggestions
 * @returns 400 - Validation error (invalid period parameter)
 * @returns 401 - User not authenticated
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async (context) => {
  const { url, locals } = context;
  const supabase = locals.supabase;

  // TODO: Replace with actual authentication when implemented
  // const { data: { user }, error: authError } = await supabase.auth.getUser();
  // if (authError || !user) {
  //   return createUnauthorizedResponse();
  // }
  // const userId = user.id;

  // Temporary: Use DEFAULT_USER_ID for development
  const userId = DEFAULT_USER_ID;

  try {
    // Validate query parameters
    const params = getStatisticsQuerySchema.parse({
      period: url.searchParams.get("period"),
    });

    // Get statistics from service
    const statistics = await getUserStatistics(supabase, userId, params.period || "all");

    return new Response(JSON.stringify(statistics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error);
    }

    // Log unexpected errors
    console.error("Unexpected error in GET /api/statistics:", error);
    return createInternalErrorResponse();
  }
};
