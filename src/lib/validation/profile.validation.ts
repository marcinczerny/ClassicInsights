import { z } from "zod";

/**
 * Validation schema for updating user profile
 * Ensures at least one field is provided in the request body
 */
export const updateProfileSchema = z
  .object({
    has_agreed_to_ai_data_processing: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
