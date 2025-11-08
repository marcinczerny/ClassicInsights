import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email.'),
  password: z.string().min(1, 'Hasło jest wymagane.'),
});

// ============================================================================
// RELATIONSHIP TYPE SCHEMA
// ============================================================================

/**
 * Relationship type enum schema
 * Used for both entity-entity relationships and note-entity associations
 */
export const relationshipTypeSchema = z.enum([
  "criticizes",
  "is_student_of",
  "expands_on",
  "influenced_by",
  "is_example_of",
  "is_related_to",
]);

export type RelationshipType = z.infer<typeof relationshipTypeSchema>;

// ============================================================================
// NOTE SCHEMAS
// ============================================================================

export const getNotesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["created_at", "updated_at", "title"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  entities: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",") : undefined)),
  search: z.string().optional(),
});

export type GetNotesParams = z.infer<typeof getNotesSchema>;

/**
 * Entity reference with optional relationship type
 * Used in new format for creating/updating notes with typed relationships
 */
export const entityReferenceSchema = z.object({
  entity_id: z.string().uuid({ message: "Entity ID must be a valid UUID." }),
  relationship_type: relationshipTypeSchema.optional(),
});

/**
 * Create note command schema
 * Supports both new format (entities with relationship_type) and legacy format (entity_ids)
 */
export const createNoteSchema = z
  .object({
    title: z.string().min(1, "Title is required.").max(255),
    content: z.string().max(10000).optional(),
    // New format with relationship types
    entities: z.array(entityReferenceSchema).optional(),
    // Legacy format (deprecated)
    entity_ids: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => !data.entities || !data.entity_ids, {
    message: "Cannot provide both 'entities' and 'entity_ids'",
  });

export const getNoteSchema = z.object({
  id: z.string().uuid({ message: "Note ID must be a valid UUID." }),
});

/**
 * Update note command schema
 * Supports both new format (entities with relationship_type) and legacy format (entity_ids)
 * All fields are optional for partial updates
 */
export const updateNoteSchema = z
  .object({
    title: z.string().min(1, "Title is required.").max(255).optional(),
    content: z.string().max(10000).optional(),
    // New format with relationship types
    entities: z.array(entityReferenceSchema).optional(),
    // Legacy format (deprecated)
    entity_ids: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field to update must be provided.",
  })
  .refine((data) => !data.entities || !data.entity_ids, {
    message: "Cannot provide both 'entities' and 'entity_ids'",
  });

/**
 * Add entity to note command schema
 * Supports optional relationship_type (defaults to 'is_related_to' in service layer)
 */
export const addEntityToNoteSchema = z.object({
  entity_id: z.string().uuid({ message: "Entity ID must be a valid UUID." }),
  relationship_type: relationshipTypeSchema.optional(),
});

export const removeEntityFromNoteSchema = z.object({
  id: z.string().uuid({ message: "Note ID must be a valid UUID." }),
  entityId: z.string().uuid({ message: "Entity ID must be a valid UUID." }),
});

// ============================================================================
// AI SUGGESTIONS SCHEMAS
// ============================================================================

/**
 * Suggestion status enum schema
 * Used for filtering suggestions by their status
 */
export const suggestionStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
]);

export type SuggestionStatus = z.infer<typeof suggestionStatusSchema>;

/**
 * Get suggestions query parameters schema
 * Used for GET /api/notes/:id/suggestions
 */
export const getSuggestionsSchema = z.object({
  status: suggestionStatusSchema.optional(),
});

export type GetSuggestionsParams = z.infer<typeof getSuggestionsSchema>;

/**
 * Get suggestion by ID schema
 * Used for validating suggestion ID parameter
 */
export const getSuggestionSchema = z.object({
  id: z.string().uuid({ message: "Suggestion ID must be a valid UUID." }),
});

/**
 * Update suggestion command schema
 * Used for PATCH /api/suggestions/:id
 * Only allows status updates to accepted or rejected
 */
export const updateSuggestionSchema = z.object({
  status: z.enum(["accepted", "rejected"], {
    errorMap: () => ({ message: "Status must be either 'accepted' or 'rejected'" }),
  }),
});

export type UpdateSuggestionCommand = z.infer<typeof updateSuggestionSchema>;

// ============================================================================
// ENTITY SCHEMAS
// ============================================================================

export const entityTypes = [
	"person",
	"work",
	"epoch",
	"idea",
	"school",
	"system",
	"other",
] as const;

export const getEntitiesSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().positive().max(100).optional().default(50),
	search: z.string().optional(),
	type: z.enum(entityTypes).optional(),
	sort: z
		.enum(["name", "created_at", "type"])
		.optional()
		.default("name"),
	order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const createEntitySchema = z.object({
	name: z.string().min(1).max(100),
	type: z.enum(entityTypes),
	description: z.string().max(1000).optional(),
});

export const getEntitySchema = z.object({
  id: z.string().uuid({ message: "Entity ID must be a valid UUID." }),
});

export const updateEntitySchema = createEntitySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field to update must be provided.",
  }
);

export const deleteEntitySchema = z.object({
  id: z.string().uuid({ message: "Entity ID must be a valid UUID." }),
});

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 * Reusable schema for validating UUID parameters
 */
export const uuidSchema = z.string().uuid({ message: "Must be a valid UUID." });