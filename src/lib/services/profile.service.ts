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
 * Deletes the user account and all associated data
 * Note: This requires Supabase admin client or RPC function
 * Currently throws an error as admin client is not configured
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID whose account to delete
 * @throws Error indicating admin client is required
 */
export async function deleteAccount(
	supabase: SupabaseClient,
	userId: string
): Promise<void> {
	// NOTE: This requires either:
	// 1. Supabase admin client with service role key
	// 2. Supabase RPC function for account deletion
	// For now, we'll throw an error indicating this needs to be configured

	// TODO: Implement using one of these approaches:
	// Option A: supabase.auth.admin.deleteUser(userId) - requires admin client
	// Option B: supabase.rpc('delete_user_account', { user_id: userId })

	throw new Error("Account deletion requires admin privileges - not yet configured");
}
