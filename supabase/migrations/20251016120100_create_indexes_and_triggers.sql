-- Migration: Create indexes and triggers
-- Purpose: Add performance indexes and automatic timestamp updates
-- Affected: All core tables receive indexes on foreign keys, trigger for updated_at columns
-- Author: Database setup based on db-plan.md
-- Date: 2025-10-16

-- =====================================================================
-- 1. Create Performance Indexes
-- =====================================================================

-- Indexes for profiles table
-- These optimize lookups by user_id for profile retrieval
create index idx_profiles_user_id on profiles(user_id);

-- Indexes for notes table
-- Optimizes filtering notes by user
create index idx_notes_user_id on notes(user_id);

-- Indexes for entities table
-- Optimizes filtering entities by user
create index idx_entities_user_id on entities(user_id);

-- Indexes for note_entities junction table
-- Bidirectional lookups: find entities for a note, or notes for an entity
create index idx_note_entities_note_id on note_entities(note_id);
create index idx_note_entities_entity_id on note_entities(entity_id);

-- Indexes for relationships table
-- Optimizes filtering by user and traversing the knowledge graph
create index idx_relationships_user_id on relationships(user_id);
create index idx_relationships_source_entity_id on relationships(source_entity_id);
create index idx_relationships_target_entity_id on relationships(target_entity_id);

-- Indexes for ai_suggestions table
-- Optimizes filtering suggestions by user, note, status, and linked entity
create index idx_ai_suggestions_user_id on ai_suggestions(user_id);
create index idx_ai_suggestions_note_id on ai_suggestions(note_id);
create index idx_ai_suggestions_suggested_entity_id on ai_suggestions(suggested_entity_id);
create index idx_ai_suggestions_status on ai_suggestions(status);

-- Indexes for ai_error_logs table
-- Optimizes filtering error logs by user for debugging and analytics
create index idx_ai_error_logs_user_id on ai_error_logs(user_id);

-- =====================================================================
-- 2. Create Trigger Function for Automatic updated_at Updates
-- =====================================================================

-- Function to automatically update the updated_at timestamp
-- This ensures timestamp accuracy without requiring application logic
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- 3. Attach Triggers to Tables with updated_at Columns
-- =====================================================================

-- Trigger for profiles table
-- Automatically updates updated_at whenever a profile is modified
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- Trigger for notes table
-- Automatically updates updated_at whenever a note is modified
create trigger update_notes_updated_at
  before update on notes
  for each row
  execute function update_updated_at_column();

-- Trigger for entities table
-- Automatically updates updated_at whenever an entity is modified
create trigger update_entities_updated_at
  before update on entities
  for each row
  execute function update_updated_at_column();

-- Trigger for ai_suggestions table
-- Automatically updates updated_at whenever a suggestion status changes
create trigger update_ai_suggestions_updated_at
  before update on ai_suggestions
  for each row
  execute function update_updated_at_column();

