import type { APIContext } from "astro";
import {
	getProfile,
	updateProfile,
	deleteAccount,
} from "../../lib/services/profile.service.ts";
import { DEFAULT_USER_ID } from "../../db/supabase.client.ts";
import type { ErrorDTO, ProfileDTO } from "../../types.ts";
import { updateProfileSchema } from "../../lib/validation/profile.validation.ts";

export const prerender = false;

/**
 * GET /api/profile
 * Retrieves the authenticated user's profile
 *
 * @returns 200 - Profile data
 * @returns 401 - User not authenticated
 * @returns 404 - Profile not found
 * @returns 500 - Internal server error
 */
export async function GET(context: APIContext): Promise<Response> {
	const supabase = context.locals.supabase;

	// TODO: Replace with actual authentication when implemented
	// const user = context.locals.user;
	// if (!user) {
	//   return new Response(
	//     JSON.stringify({
	//       error: {
	//         code: "UNAUTHORIZED",
	//         message: "User not authenticated",
	//       },
	//     } satisfies ErrorDTO),
	//     { status: 401, headers: { "Content-Type": "application/json" } }
	//   );
	// }

	// Temporary: Use DEFAULT_USER_ID for development
	const userId = DEFAULT_USER_ID;

	try {
		const profile = await getProfile(supabase, userId);

		if (!profile) {
			return new Response(
				JSON.stringify({
					error: {
						code: "NOT_FOUND",
						message: "Profile not found",
					},
				} satisfies ErrorDTO),
				{ status: 404, headers: { "Content-Type": "application/json" } }
			);
		}

		return new Response(JSON.stringify(profile satisfies ProfileDTO), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error fetching profile:", error);

		return new Response(
			JSON.stringify({
				error: {
					code: "INTERNAL_ERROR",
					message: "A database error occurred. Please try again later.",
				},
			} satisfies ErrorDTO),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

/**
 * PATCH /api/profile
 * Updates the authenticated user's profile
 *
 * @returns 200 - Updated profile data
 * @returns 400 - Validation error
 * @returns 401 - User not authenticated
 * @returns 404 - Profile not found
 * @returns 500 - Internal server error
 */
export async function PATCH(context: APIContext): Promise<Response> {
	const supabase = context.locals.supabase;

	// TODO: Replace with actual authentication when implemented
	// const user = context.locals.user;
	// if (!user) {
	//   return new Response(
	//     JSON.stringify({
	//       error: {
	//         code: "UNAUTHORIZED",
	//         message: "User not authenticated",
	//       },
	//     } satisfies ErrorDTO),
	//     { status: 401, headers: { "Content-Type": "application/json" } }
	//   );
	// }

	// Temporary: Use DEFAULT_USER_ID for development
	const userId = DEFAULT_USER_ID;

	let body;
	try {
		body = await context.request.json();
	} catch {
		return new Response(
			JSON.stringify({
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid JSON in request body",
				},
			} satisfies ErrorDTO),
			{ status: 400, headers: { "Content-Type": "application/json" } }
		);
	}

	// Validate request body using Zod schema
	const validation = updateProfileSchema.safeParse(body);

	if (!validation.success) {
		return new Response(
			JSON.stringify({
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid request body",
					details: validation.error.errors,
				},
			} satisfies ErrorDTO),
			{ status: 400, headers: { "Content-Type": "application/json" } }
		);
	}

	try {
		const updatedProfile = await updateProfile(supabase, userId, validation.data);

		return new Response(JSON.stringify(updatedProfile satisfies ProfileDTO), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error updating profile:", error);

		// Check if it's a "not found" error
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		if (errorMessage.includes("Profile not found")) {
			return new Response(
				JSON.stringify({
					error: {
						code: "NOT_FOUND",
						message: "Profile not found",
					},
				} satisfies ErrorDTO),
				{ status: 404, headers: { "Content-Type": "application/json" } }
			);
		}

		return new Response(
			JSON.stringify({
				error: {
					code: "INTERNAL_ERROR",
					message: "A database error occurred. Please try again later.",
				},
			} satisfies ErrorDTO),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

/**
 * DELETE /api/profile
 * Deletes the authenticated user's account and all associated data
 * This is an irreversible operation that removes:
 * - User profile
 * - All notes
 * - All entities
 * - All relationships
 * - All note-entity associations
 * AI-related data is anonymized (user_id set to NULL)
 *
 * @returns 204 - Account deleted successfully (no content)
 * @returns 401 - User not authenticated
 * @returns 500 - Internal server error
 */
export async function DELETE(context: APIContext): Promise<Response> {
	const supabase = context.locals.supabase;

	// TODO: Replace with actual authentication when implemented
	// const user = context.locals.user;
	// if (!user) {
	//   return new Response(
	//     JSON.stringify({
	//       error: {
	//         code: "UNAUTHORIZED",
	//         message: "User not authenticated",
	//       },
	//     } satisfies ErrorDTO),
	//     { status: 401, headers: { "Content-Type": "application/json" } }
	//   );
	// }

	// Note: For DELETE, the RPC function uses auth.uid() internally,
	// so we don't need to pass userId. The function validates authentication.

	try {
		await deleteAccount(supabase);

		// Return 204 No Content on successful deletion
		return new Response(null, { status: 204 });
	} catch (error) {
		console.error("Error deleting account:", error);

		return new Response(
			JSON.stringify({
				error: {
					code: "INTERNAL_ERROR",
					message: "Failed to delete account. Please try again later.",
				},
			} satisfies ErrorDTO),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}
