import type { APIRoute } from "astro";
import { getSuggestionSchema, updateSuggestionSchema } from "@/lib/validation";
import { updateSuggestionStatus } from "@/lib/services/suggestions.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { handleServiceError, createErrorResponse } from "@/lib/errors";

export const prerender = false;

/**
 * PATCH /api/suggestions/:id
 *
 * Updates the status of an AI suggestion from pending to either accepted or rejected.
 * When a suggestion is accepted, executes business logic based on the suggestion type:
 *
 * - new_entity: Creates a new entity and links it to the note
 * - existing_entity_link: Links an existing entity to the note
 * - quote: Appends the quote to the note content under a "## Quotes" section
 * - summary: Appends the summary to the note content under a "## Summary" section
 *
 * Requirements:
 * - Suggestion must exist and belong to the authenticated user
 * - Suggestion status must be "pending" (cannot update already accepted/rejected suggestions)
 *
 * Request Body:
 * {
 *   "status": "accepted" | "rejected"
 * }
 *
 * Success Response (200):
 * Returns the full updated suggestion object with new status
 * {
 *   "id": "uuid",
 *   "note_id": "uuid",
 *   "user_id": "uuid",
 *   "type": "quote" | "summary" | "new_entity" | "existing_entity_link",
 *   "status": "accepted" | "rejected",
 *   "name": "string",
 *   "content": "string",
 *   "suggested_entity_id": "uuid | null",
 *   "generation_duration_ms": 123,
 *   "created_at": "timestamp",
 *   "updated_at": "timestamp"
 * }
 *
 * Error Responses:
 * - 400: Invalid request body or invalid state transition (INVALID_PAYLOAD, INVALID_STATE_TRANSITION)
 * - 403: Suggestion doesn't belong to user (FORBIDDEN_ACCESS)
 * - 404: Suggestion not found (SUGGESTION_NOT_FOUND)
 * - 500: Database error or business logic failure
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
	// TODO: Replace with actual authentication
	// const session = await locals.supabase.auth.getSession();
	// if (!session.data.session) {
	//   return createUnauthorizedResponse();
	// }
	// const userId = session.data.session.user.id;
	const userId = DEFAULT_USER_ID;

	// Validate URL parameter (suggestion ID)
	const paramsValidation = getSuggestionSchema.safeParse(params);
	if (!paramsValidation.success) {
		return createErrorResponse(
			"VALIDATION_ERROR",
			"Invalid suggestion ID",
			400,
			paramsValidation.error.errors
		);
	}

	const { id: suggestionId } = paramsValidation.data;

	try {
		// Validate request body
		const body = await request.json();
		const bodyValidation = updateSuggestionSchema.safeParse(body);

		if (!bodyValidation.success) {
			return createErrorResponse(
				"INVALID_PAYLOAD",
				"Invalid request body",
				400,
				bodyValidation.error.errors
			);
		}

		const { status } = bodyValidation.data;

		// Call service to update suggestion status and execute business logic
		const updatedSuggestion = await updateSuggestionStatus(
			suggestionId,
			status,
			locals.supabase,
			userId
		);

		return new Response(JSON.stringify(updatedSuggestion), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleServiceError(error);
	}
};
