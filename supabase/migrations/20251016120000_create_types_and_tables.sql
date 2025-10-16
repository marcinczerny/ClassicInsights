-- Migration: Create ENUM types and core tables
-- Purpose: Initial database setup for ClassicInsight application
-- Affected: Creates all custom types and base tables for the application
-- Author: Database setup based on db-plan.md
-- Date: 2025-10-16

-- =====================================================================
-- 1. Create Custom ENUM Types
-- =====================================================================

-- entity_type: Types of entities (tags) that users can assign to notes
-- These represent different philosophical and literary concepts
create type entity_type as enum (
  'person',       -- Person (e.g., philosopher, writer)
  'work',         -- Work (e.g., book, treatise)
  'epoch',        -- Epoch (e.g., Enlightenment, Antiquity)
  'idea',         -- Idea (e.g., existentialism, stoicism)
  'school',       -- School/movement (e.g., Frankfurt School)
  'system',       -- Philosophical system (e.g., Kantianism)
  'other'         -- Other/miscellaneous
);

-- relationship_type: Types of relationships that can connect two entities in the thought graph
-- These define how entities relate to each other conceptually
create type relationship_type as enum (
  'criticizes',        -- Criticizes
  'is_student_of',     -- Is a student of
  'expands_on',        -- Expands on the thought
  'influenced_by',     -- Was influenced by
  'is_example_of',     -- Is an example of
  'is_related_to'      -- Is related to (default/generic)
);

-- suggestion_status: Status of AI-generated suggestions
-- Tracks user interaction with AI suggestions
create type suggestion_status as enum (
  'pending',      -- Awaiting user action
  'accepted',     -- Accepted by user
  'rejected'      -- Rejected by user
);

-- suggestion_type: Type of AI-generated suggestion
-- Defines what kind of enhancement the AI is proposing
create type suggestion_type as enum (
  'quote',                  -- Suggested quote
  'summary',                -- Suggested summary
  'new_entity',             -- Suggestion to create a new entity
  'existing_entity_link'    -- Suggestion to link with existing entity
);

-- =====================================================================
-- 2. Create Core Tables
-- =====================================================================

-- profiles: Extends built-in auth.users with application-specific information
-- One-to-one relationship with auth.users
-- Stores user preferences and consent information
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid unique not null references auth.users(id) on delete cascade,
  has_agreed_to_ai_data_processing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- notes: Stores user-created notes
-- Each note belongs to a single user
-- Content is limited to 10,000 characters
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title varchar(255) not null,
  content text check (length(content) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- entities: Stores entities (tags) that are unique per user account
-- Entities are the building blocks of the knowledge graph
-- Name must be unique within a user's account
create table entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null,
  type entity_type not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

-- note_entities: Junction table for many-to-many relationship between notes and entities
-- Allows notes to be tagged with multiple entities and entities to appear in multiple notes
create table note_entities (
  note_id uuid not null references notes(id) on delete cascade,
  entity_id uuid not null references entities(id) on delete cascade,
  primary key (note_id, entity_id)
);

-- relationships: Stores directed and typed relationships between two entities
-- Creates the edges in the knowledge graph
-- Relationships are unique per combination of user, source, target, and type
create table relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_entity_id uuid not null references entities(id) on delete cascade,
  target_entity_id uuid not null references entities(id) on delete cascade,
  type relationship_type not null default 'is_related_to',
  created_at timestamptz not null default now(),
  unique(user_id, source_entity_id, target_entity_id, type)
);

-- ai_suggestions: Stores AI-generated suggestions for individual notes
-- Links to users and notes with ON DELETE SET NULL to preserve anonymized data for analytics
-- This allows AI performance monitoring without storing personal data after deletion
create table ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  note_id uuid references notes(id) on delete set null,
  name varchar(255),
  content text check (length(content) <= 1000),
  type suggestion_type not null,
  status suggestion_status not null default 'pending',
  suggested_entity_id uuid references entities(id) on delete set null,
  generation_duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ai_error_logs: Logs errors that occurred during AI suggestion generation
-- Uses BIGSERIAL for high-volume logging
-- ON DELETE SET NULL preserves anonymized error data for system monitoring
-- This helps track AI model performance without retaining user information
create table ai_error_logs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  model_name varchar(100),
  source_text_hash varchar(64),
  error_code varchar(50),
  error_message text,
  created_at timestamptz not null default now()
);

