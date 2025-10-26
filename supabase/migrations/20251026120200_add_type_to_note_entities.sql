-- Add type and created_at columns to note_entities table
-- This migration adds relationship type support to note-entity associations

-- Add type column with default value 'is_related_to'
ALTER TABLE note_entities
ADD COLUMN type relationship_type NOT NULL DEFAULT 'is_related_to';

-- Add created_at column with default value NOW()
ALTER TABLE note_entities
ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create index on type column for better query performance
CREATE INDEX idx_note_entities_type ON note_entities(type);

-- Add comment to explain the purpose of the type column
COMMENT ON COLUMN note_entities.type IS 'Defines the type of relationship between a note and an entity (e.g., criticizes, expands_on, is_related_to)';
