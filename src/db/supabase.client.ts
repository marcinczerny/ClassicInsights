import { createClient, type SupabaseClient as SupabaseClientGeneric } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = SupabaseClientGeneric<Database>;

// NOTE: This is a temporary solution for development purposes.
export const DEFAULT_USER_ID = "945a7e4e-4576-49f7-b604-b5a1710cb71d";

import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Handles Supabase Postgrest errors by logging them and throwing a generic error.
 * This prevents leaking sensitive database details to the client.
 * @param error The PostgrestError from a Supabase query.
 * @returns Never, as it always throws an error.
 */
export function handleSupabaseError(error: PostgrestError): never {
	// In a real application, you'd want to log this to a proper logging service.
	console.error("Supabase Error:", JSON.stringify(error, null, 2));

	// Throw a generic error to the client.
	throw new Error("A database error occurred. Please try again later.");
}