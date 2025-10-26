import type { APIRoute } from "astro";
import { getNoteSchema, getSuggestionsSchema } from "@/lib/validation";
import { getSuggestionsForNote } from "@/lib/services/suggestions.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { handleServiceError, createErrorResponse } from "@/lib/errors";

export const prerender = false;

/**
 * GET /api/notes/:id/suggestions
 *
 * Retrieves all AI-generated suggestions for a specific note.
 * Optionally filters suggestions by status (pending, accepted, rejected).
 *
 * Query Parameters:
 * - status (optional): Filter by suggestion status - one of: pending, accepted, rejected
 *
 * Requirements:
 * - Note must exist and belong to the authenticated user
 * - Suggestions are ordered by creation date (newest first)
 *
 * Success Response (200):
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "note_id": "uuid",
 *       "user_id": "uuid",
 *       "type": "quote" | "summary" | "new_entity" | "existing_entity_link",
 *       "status": "pending" | "accepted" | "rejected",
 *       "name": "string",
 *       "content": "string",
 *       "suggested_entity_id": "uuid | null",
 *       "generation_duration_ms": 123,
 *       "created_at": "timestamp",
 *       "updated_at": "timestamp"
 *     }
 *   ]
 * }
 *
 * Error Responses:
 * - 400: Invalid status parameter (INVALID_QUERY_PARAM)
 * - 403: Note doesn't belong to user (FORBIDDEN_ACCESS)
 * - 404: Note not found (NOTE_NOT_FOUND)
 * - 500: Database error
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
	// TODO: Replace with actual authentication
	// const session = await locals.supabase.auth.getSession();
	// if (!session.data.session) {
	//   return createUnauthorizedResponse();
	// }
	// const userId = session.data.session.user.id;
	const userId = DEFAULT_USER_ID;

	// Validate URL parameter (note ID)
	const paramsValidation = getNoteSchema.safeParse(params);
	if (!paramsValidation.success) {
		return createErrorResponse(
			"VALIDATION_ERROR",
			"Invalid note ID",
			400,
			paramsValidation.error.errors
		);
	}

	const { id: noteId } = paramsValidation.data;

	// Parse and validate query parameters
	const queryParams = {
		status: url.searchParams.get("status") || undefined,
	};

	const queryValidation = getSuggestionsSchema.safeParse(queryParams);
	if (!queryValidation.success) {
		return createErrorResponse(
			"INVALID_QUERY_PARAM",
			"Invalid query parameter",
			400,
			queryValidation.error.errors
		);
	}

	try {
		// Call service to retrieve suggestions
		const result = await getSuggestionsForNote(
			noteId,
			locals.supabase,
			userId,
			queryValidation.data
		);

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleServiceError(error);
	}
};
