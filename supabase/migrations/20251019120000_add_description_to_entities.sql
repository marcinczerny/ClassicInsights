-- Add description column to entities table
-- This migration adds an optional description field to the entities table
-- as specified in the database plan

ALTER TABLE entities
ADD COLUMN description TEXT CHECK (length(description) <= 1000);
