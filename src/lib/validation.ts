import { z } from "zod";

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

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required.").max(255),
  content: z.string().max(10000).optional(),
  entity_ids: z.array(z.string().uuid()).optional(),
});

export const getNoteSchema = z.object({
  id: z.string().uuid({ message: "Note ID must be a valid UUID." }),
});

export const updateNoteSchema = createNoteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field to update must be provided.",
  }
);

export const addEntityToNoteSchema = z.object({
  entity_id: z.string().uuid({ message: "Entity ID must be a valid UUID." }),
});

export const removeEntityFromNoteSchema = z.object({
  id: z.string().uuid({ message: "Note ID must be a valid UUID." }),
  entityId: z.string().uuid({ message: "Entity ID must be a valid UUID." }),
});

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
	search: z.string().optional(),
	type: z.enum(entityTypes).optional(),
	limit: z.coerce.number().int().positive().max(100).optional().default(50),
	sort: z
		.enum(["name", "created_at", "type", "note_count"])
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