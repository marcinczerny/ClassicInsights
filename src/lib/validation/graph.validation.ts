import { z } from "zod";

/**
 * Validation schema for graph query parameters
 * Used in GET /api/graph endpoint
 */
export const graphQuerySchema = z.object({
  center_id: z.string().uuid({ message: "center_id must be a valid UUID" }),
  center_type: z.enum(["entity", "note"], {
    errorMap: () => ({ message: "center_type must be either 'entity' or 'note'" })
  }),
  levels: z.coerce
    .number()
    .int({ message: "levels must be an integer" })
    .min(1, { message: "levels must be at least 1" })
    .max(3, { message: "levels cannot exceed 3" })
    .default(2)
});
