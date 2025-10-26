-- Migration: Create RPC function for account deletion
-- Purpose: Allow users to delete their own accounts with all associated data
-- Affected: Creates delete_user_account RPC function
-- Author: Profile Management API implementation
-- Date: 2025-10-26

-- =====================================================================
-- 1. Create Function to Delete User Account
-- =====================================================================

-- Function to delete a user account and all associated data
-- This function can be called by authenticated users to delete their own account
-- The CASCADE constraints in the database will automatically delete:
-- - Profile record
-- - All notes
-- - All entities
-- - All relationships
-- - All note_entities associations
-- AI-related data (ai_suggestions, ai_error_logs) will be anonymized (SET NULL)
create or replace function public.delete_user_account()
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  current_user_id uuid;
begin
  -- Get the currently authenticated user's ID
  current_user_id := auth.uid();

  -- Check if user is authenticated
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Delete the user from auth.users
  -- This will CASCADE delete the profile and all related data
  -- due to ON DELETE CASCADE constraints in the schema
  delete from auth.users
  where id = current_user_id;

  -- Note: In Supabase, deleting from auth.users requires the function
  -- to be SECURITY DEFINER so it can bypass RLS policies
end;
$$;

-- =====================================================================
-- 2. Add Comment for Documentation
-- =====================================================================

comment on function public.delete_user_account() is
  'Allows authenticated users to delete their own account. Deletes the user from auth.users which cascades to delete all associated data (profile, notes, entities, relationships). AI-related data is anonymized.';

-- =====================================================================
-- 3. Grant Execute Permission to Authenticated Users
-- =====================================================================

-- Allow authenticated users to call this function
grant execute on function public.delete_user_account() to authenticated;
