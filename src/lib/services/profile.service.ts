import { handleSupabaseError, type SupabaseClient } from "@/db/supabase.client";
import type { ProfileDTO, UpdateProfileCommand } from "@/types";

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileDTO | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    handleSupabaseError(error);
  }

  return data;
}

export async function updateProfile(supabase: SupabaseClient, userId: string, updateData: UpdateProfileCommand): Promise<ProfileDTO> {
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

export async function deleteAccount(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc("delete_user_account");

  if (error) {
    handleSupabaseError(error);
  }
}
