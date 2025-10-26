import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { ProfileDTO, UpdateProfileCommand } from "../../types.ts";
import { handleSupabaseError } from "../../db/supabase.client.ts";

/**
 * Retrieves the user profile by user ID
 * @param supabase - Supabase client instance
 * @param userId - User ID to retrieve profile for
 * @returns Profile data or null if not found
 * @throws Error if database query fails
 */
export async function getProfile(
	supabase: SupabaseClient,
	userId: string
): Promise<ProfileDTO | null> {
	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("user_id", userId)
		.single();

	if (error) {
		// If profile not found, return null instead of throwing
		if (error.code === "PGRST116") {
			return null;
		}
		handleSupabaseError(error);
	}

	return data;
}

/**
 * Updates the user profile
 * @param supabase - Supabase client instance
 * @param userId - User ID whose profile to update
 * @param updateData - Fields to update
 * @returns Updated profile data
 * @throws Error if profile not found or database query fails
 */
export async function updateProfile(
	supabase: SupabaseClient,
	userId: string,
	updateData: UpdateProfileCommand
): Promise<ProfileDTO> {
	const { data, error } = await supabase
		.from("profiles")
		.update(updateData)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) {
		handleSupabaseError(error);
	}

	if (!data) {
		throw new Error("Profile not found");
	}

	return data;
}

/**
 * Deletes the user account and all associated data using RPC function
 * Calls the delete_user_account() RPC which deletes the user from auth.users
 * Database CASCADE constraints automatically delete all related data:
 * - Profile record
 * - All notes
 * - All entities
 * - All relationships
 * - All note_entities associations
 * AI-related data (ai_suggestions, ai_error_logs) is anonymized (SET NULL)
 *
 * @param supabase - Supabase client instance
 * @throws Error if RPC call fails or user is not authenticated
 */
export async function deleteAccount(supabase: SupabaseClient): Promise<void> {
	const { error } = await supabase.rpc("delete_user_account");

	if (error) {
		handleSupabaseError(error);
	}
}
