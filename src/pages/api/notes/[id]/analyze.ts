import type { APIRoute } from "astro";
import { getNoteSchema } from "@/lib/validation";
import { analyzeNote } from "@/lib/services/suggestions.service";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { handleServiceError, createErrorResponse } from "@/lib/errors";

export const prerender = false;

/**
 * POST /api/notes/:id/analyze
 *
 * Analyzes a note using AI to generate suggestions such as quotes, summaries,
 * and entity relationships. Currently uses a mock AI service for development.
 *
 * Requirements:
 * - User must have agreed to AI data processing (has_agreed_to_ai_data_processing = true)
 * - Note must exist and belong to the authenticated user
 * - Note content must be at least 10 characters long
 *
 * Success Response (200):
 * {
 *   "note_id": "uuid",
 *   "suggestions": [...],
 *   "generation_duration_ms": 123
 * }
 *
 * Error Responses:
 * - 400: User hasn't agreed to AI processing (AI_CONSENT_REQUIRED)
 * - 403: Note doesn't belong to user (FORBIDDEN_ACCESS)
 * - 404: Note not found (NOTE_NOT_FOUND)
 * - 422: Note content too short (NOTE_CONTENT_TOO_SHORT)
 * - 500: AI service error or database error
 */
export const POST: APIRoute = async ({ params, locals }) => {
	// TODO: Replace with actual authentication
	// const session = await locals.supabase.auth.getSession();
	// if (!session.data.session) {
	//   return createUnauthorizedResponse();
	// }
	// const userId = session.data.session.user.id;
	const userId = DEFAULT_USER_ID;

	// Validate URL parameter
	const validationResult = getNoteSchema.safeParse(params);

	if (!validationResult.success) {
		return createErrorResponse(
			"VALIDATION_ERROR",
			"Invalid note ID",
			400,
			validationResult.error.errors
		);
	}

	const { id: noteId } = validationResult.data;

	try {
		// Call service to analyze note and generate suggestions
		const result = await analyzeNote(noteId, locals.supabase, userId);

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleServiceError(error);
	}
};
