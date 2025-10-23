import { createClient, type SupabaseClient as SupabaseClientGeneric } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = SupabaseClientGeneric<Database>;

// NOTE: This is a temporary solution for development purposes.
export const DEFAULT_USER_ID = "945a7e4e-4576-49f7-b604-b5a1710cb71d";
