-- Migration: Update profile auto-creation trigger to use AI consent from user metadata
-- Purpose: Fix AI consent not being preserved during email confirmation
-- Affected: Updates the handle_new_user function to extract AI consent from user metadata
-- Author: AI consent fix implementation
-- Date: 2025-11-16

-- =====================================================================
-- Update Function to Handle New User Registration with AI Consent
-- =====================================================================

-- Function to automatically create a profile for newly registered users
-- This ensures every user in auth.users has a corresponding profile record
-- The profile is created with AI consent from user metadata (defaults to false if not set)
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Extract AI consent from user metadata, defaulting to false if not provided
  -- raw_user_meta_data->>'ai_consent' returns the value as text, so we cast it to boolean
  insert into public.profiles (id, user_id, has_agreed_to_ai_data_processing)
  values (
    new.id,
    new.id,
    coalesce((new.raw_user_meta_data->>'ai_consent')::boolean, false)
  );

  return new;
end;
$$;

-- =====================================================================
-- Update Comment for Documentation
-- =====================================================================

comment on function public.handle_new_user() is
  'Automatically creates a profile record when a new user registers. Ensures every auth.users record has a corresponding profiles record with AI consent extracted from user metadata or defaulting to false.';
