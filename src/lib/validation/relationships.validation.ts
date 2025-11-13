/**
 * Validation schemas for relationship API endpoints
 * Uses Zod for runtime type checking and validation
 */

import { z } from "zod";

/**
 * Enum schema for relationship types
 * Must match the relationship_type enum in the database
 */
export const relationshipTypeSchema = z.enum([
  "criticizes",
  "is_student_of",
  "expands_on",
  "influenced_by",
  "is_example_of",
  "is_related_to",
]);

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Query parameters schema for GET /api/relationships
 */
export const getRelationshipsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  source_entity_id: uuidSchema.optional(),
  target_entity_id: uuidSchema.optional(),
  type: relationshipTypeSchema.optional(),
});

export type GetRelationshipsQuery = z.infer<typeof getRelationshipsQuerySchema>;

/**
 * Request body schema for POST /api/relationships
 */
export const createRelationshipSchema = z.object({
  source_entity_id: uuidSchema,
  target_entity_id: uuidSchema,
  type: relationshipTypeSchema,
});

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;

/**
 * Request body schema for PATCH /api/relationships/:id
 */
export const updateRelationshipSchema = z.object({
  type: relationshipTypeSchema,
});

export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>;

/**
 * URL parameter schema for endpoints with :id
 */
export const relationshipIdSchema = z.object({
  id: uuidSchema,
});

export type RelationshipIdParam = z.infer<typeof relationshipIdSchema>;
