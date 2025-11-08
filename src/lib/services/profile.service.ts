import { supabaseClient, handleSupabaseError } from '@/db/supabase.client';
import type { ProfileDTO, UpdateProfileCommand } from '@/types';

export async function getProfile(userId: string): Promise<ProfileDTO | null> {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    handleSupabaseError(error);
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updateData: UpdateProfileCommand,
): Promise<ProfileDTO> {
  const { data, error } = await supabaseClient
    .from('profiles')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error);
  }

  if (!data) {
    throw new Error('Profile not found');
  }

  return data;
}

export async function deleteAccount(): Promise<void> {
  const { error } = await supabaseClient.rpc('delete_user_account');

  if (error) {
    handleSupabaseError(error);
  }
}
