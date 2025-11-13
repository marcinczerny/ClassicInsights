import { createClient, type SupabaseClient as SupabaseClientGeneric } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = SupabaseClientGeneric<Database>;

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
