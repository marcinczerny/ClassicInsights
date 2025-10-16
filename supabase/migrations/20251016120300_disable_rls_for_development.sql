-- Migration: Disable Row Level Security for development
-- Purpose: Temporarily disable RLS to make development easier
-- Affected: All core tables have RLS disabled
-- Date: 2025-10-16
-- Note: This should be reversed before production deployment

-- =====================================================================
-- 1. Drop All RLS Policies
-- =====================================================================

-- Drop policies for profiles table
drop policy if exists "Authenticated users can select their own profile" on profiles;
drop policy if exists "Authenticated users can insert their own profile" on profiles;
drop policy if exists "Authenticated users can update their own profile" on profiles;
drop policy if exists "Authenticated users can delete their own profile" on profiles;

-- Drop policies for notes table
drop policy if exists "Authenticated users can select their own notes" on notes;
drop policy if exists "Authenticated users can insert their own notes" on notes;
drop policy if exists "Authenticated users can update their own notes" on notes;
drop policy if exists "Authenticated users can delete their own notes" on notes;

-- Drop policies for entities table
drop policy if exists "Authenticated users can select their own entities" on entities;
drop policy if exists "Authenticated users can insert their own entities" on entities;
drop policy if exists "Authenticated users can update their own entities" on entities;
drop policy if exists "Authenticated users can delete their own entities" on entities;

-- Drop policies for note_entities junction table
drop policy if exists "Authenticated users can select their own note-entity links" on note_entities;
drop policy if exists "Authenticated users can insert their own note-entity links" on note_entities;
drop policy if exists "Authenticated users can delete their own note-entity links" on note_entities;

-- Drop policies for relationships table
drop policy if exists "Authenticated users can select their own relationships" on relationships;
drop policy if exists "Authenticated users can insert their own relationships" on relationships;
drop policy if exists "Authenticated users can update their own relationships" on relationships;
drop policy if exists "Authenticated users can delete their own relationships" on relationships;

-- Drop policies for ai_suggestions table
drop policy if exists "Authenticated users can select their own AI suggestions" on ai_suggestions;
drop policy if exists "Authenticated users can insert their own AI suggestions" on ai_suggestions;
drop policy if exists "Authenticated users can update their own AI suggestions" on ai_suggestions;
drop policy if exists "Authenticated users can delete their own AI suggestions" on ai_suggestions;

-- Drop policies for ai_error_logs table
drop policy if exists "Authenticated users can select their own error logs" on ai_error_logs;
drop policy if exists "Authenticated users can insert their own error logs" on ai_error_logs;

-- =====================================================================
-- 2. Disable Row Level Security on All Tables
-- =====================================================================

-- Disable RLS for user profile data
alter table profiles disable row level security;

-- Disable RLS for user notes
alter table notes disable row level security;

-- Disable RLS for user entities (tags)
alter table entities disable row level security;

-- Disable RLS for note-entity relationships
alter table note_entities disable row level security;

-- Disable RLS for entity relationships (knowledge graph edges)
alter table relationships disable row level security;

-- Disable RLS for AI suggestions
alter table ai_suggestions disable row level security;

-- Disable RLS for AI error logs
alter table ai_error_logs disable row level security;


