-- Migration: Re-enable Row Level Security for production
-- Purpose: Re-enable RLS and restore security policies for production deployment
-- Affected: All core tables receive RLS policies
-- Author: Database security migration
-- Date: 2025-11-10
-- Security: All policies ensure users can only access their own data
-- Note: Reverses the development RLS disable migration

-- =====================================================================
-- 1. Re-enable Row Level Security on All Tables
-- =====================================================================

-- Re-enable RLS for user profile data
alter table profiles enable row level security;

-- Re-enable RLS for user notes
alter table notes enable row level security;

-- Re-enable RLS for user entities (tags)
alter table entities enable row level security;

-- Re-enable RLS for note-entity relationships
alter table note_entities enable row level security;

-- Re-enable RLS for entity relationships (knowledge graph edges)
alter table relationships enable row level security;

-- Re-enable RLS for AI suggestions
alter table ai_suggestions enable row level security;

-- Re-enable RLS for AI error logs
-- Even though this is logging data, we protect it to ensure privacy
alter table ai_error_logs enable row level security;

-- =====================================================================
-- 2. RLS Policies for profiles table
-- =====================================================================

-- Policy: Authenticated users can select their own profile
-- Rationale: Users need to read their profile data and preferences
create policy "Authenticated users can select their own profile"
  on profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Authenticated users can insert their own profile
-- Rationale: Profile creation happens after user signs up
create policy "Authenticated users can insert their own profile"
  on profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can update their own profile
-- Rationale: Users can modify their preferences and consent settings
create policy "Authenticated users can update their own profile"
  on profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can delete their own profile
-- Rationale: Users can remove their profile data
create policy "Authenticated users can delete their own profile"
  on profiles for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =====================================================================
-- 3. RLS Policies for notes table
-- =====================================================================

-- Policy: Authenticated users can select their own notes
-- Rationale: Users need to view their notes
create policy "Authenticated users can select their own notes"
  on notes for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Authenticated users can insert their own notes
-- Rationale: Users can create new notes
create policy "Authenticated users can insert their own notes"
  on notes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can update their own notes
-- Rationale: Users can edit their notes
create policy "Authenticated users can update their own notes"
  on notes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can delete their own notes
-- Rationale: Users can remove their notes
create policy "Authenticated users can delete their own notes"
  on notes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =====================================================================
-- 4. RLS Policies for entities table
-- =====================================================================

-- Policy: Authenticated users can select their own entities
-- Rationale: Users need to view their entities for tagging and graph visualization
create policy "Authenticated users can select their own entities"
  on entities for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Authenticated users can insert their own entities
-- Rationale: Users can create new entities (tags)
create policy "Authenticated users can insert their own entities"
  on entities for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can update their own entities
-- Rationale: Users can modify entity names and types
create policy "Authenticated users can update their own entities"
  on entities for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can delete their own entities
-- Rationale: Users can remove entities they no longer need
create policy "Authenticated users can delete their own entities"
  on entities for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =====================================================================
-- 5. RLS Policies for note_entities junction table
-- =====================================================================

-- Policy: Authenticated users can select their own note-entity links
-- Rationale: Users need to see which entities are linked to their notes
create policy "Authenticated users can select their own note-entity links"
  on note_entities for select
  to authenticated
  using (
    exists (
      select 1 from notes
      where notes.id = note_entities.note_id
      and notes.user_id = (select auth.uid())
    )
  );

-- Policy: Authenticated users can insert their own note-entity links
-- Rationale: Users can tag their notes with entities
create policy "Authenticated users can insert their own note-entity links"
  on note_entities for insert
  to authenticated
  with check (
    exists (
      select 1 from notes
      where notes.id = note_entities.note_id
      and notes.user_id = (select auth.uid())
    )
  );

-- Policy: Authenticated users can delete their own note-entity links
-- Rationale: Users can remove tags from their notes
create policy "Authenticated users can delete their own note-entity links"
  on note_entities for delete
  to authenticated
  using (
    exists (
      select 1 from notes
      where notes.id = note_entities.note_id
      and notes.user_id = (select auth.uid())
    )
  );

-- =====================================================================
-- 6. RLS Policies for relationships table
-- =====================================================================

-- Policy: Authenticated users can select their own relationships
-- Rationale: Users need to view their knowledge graph connections
create policy "Authenticated users can select their own relationships"
  on relationships for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Authenticated users can insert their own relationships
-- Rationale: Users can create connections in their knowledge graph
create policy "Authenticated users can insert their own relationships"
  on relationships for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can update their own relationships
-- Rationale: Users can modify relationship types
create policy "Authenticated users can update their own relationships"
  on relationships for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can delete their own relationships
-- Rationale: Users can remove connections from their knowledge graph
create policy "Authenticated users can delete their own relationships"
  on relationships for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =====================================================================
-- 7. RLS Policies for ai_suggestions table
-- =====================================================================

-- Policy: Authenticated users can select their own AI suggestions
-- Rationale: Users need to view suggestions generated for their notes
create policy "Authenticated users can select their own AI suggestions"
  on ai_suggestions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Authenticated users can insert their own AI suggestions
-- Rationale: The application creates suggestions on behalf of users
create policy "Authenticated users can insert their own AI suggestions"
  on ai_suggestions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can update their own AI suggestions
-- Rationale: Users can accept or reject suggestions (update status)
create policy "Authenticated users can update their own AI suggestions"
  on ai_suggestions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy: Authenticated users can delete their own AI suggestions
-- Rationale: Users can remove suggestions they don't want to see
create policy "Authenticated users can delete their own AI suggestions"
  on ai_suggestions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =====================================================================
-- 8. RLS Policies for ai_error_logs table
-- =====================================================================

-- Policy: Authenticated users can select their own error logs
-- Rationale: Users (or support staff) may need to view error logs for debugging
-- Note: In practice, this might be restricted to admin users only
create policy "Authenticated users can select their own error logs"
  on ai_error_logs for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Authenticated users can insert their own error logs
-- Rationale: The application logs errors on behalf of users
create policy "Authenticated users can insert their own error logs"
  on ai_error_logs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

