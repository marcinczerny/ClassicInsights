-- Migration: Create trigger for automatic profile creation
-- Purpose: Automatically create a profile record when a new user registers
-- Affected: Adds trigger to auth.users table
-- Author: Profile Management API implementation
-- Date: 2025-10-26

-- =====================================================================
-- 1. Create Function to Handle New User Registration
-- =====================================================================

-- Function to automatically create a profile for newly registered users
-- This ensures every user in auth.users has a corresponding profile record
-- The profile is created with default values (AI consent = false)
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Insert a new profile record for the newly created user
  -- id and user_id both reference the same auth.users.id
  -- has_agreed_to_ai_data_processing defaults to false
  insert into public.profiles (id, user_id, has_agreed_to_ai_data_processing)
  values (new.id, new.id, false);

  return new;
end;
$$;

-- =====================================================================
-- 2. Create Trigger on auth.users Table
-- =====================================================================

-- Trigger that fires after a new user is inserted into auth.users
-- Automatically creates a corresponding profile record
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =====================================================================
-- 3. Add Comment for Documentation
-- =====================================================================

comment on function public.handle_new_user() is
  'Automatically creates a profile record when a new user registers. Ensures every auth.users record has a corresponding profiles record with default AI consent set to false.';
