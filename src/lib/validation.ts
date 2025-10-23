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
