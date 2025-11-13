import { z } from "zod";

/**
 * Validation schema for statistics query parameters
 * Used in GET /api/statistics endpoint
 */
export const getStatisticsQuerySchema = z.object({
  period: z
    .enum(["all", "week", "month", "year"], {
      errorMap: () => ({ message: "period must be one of: all, week, month, year" }),
    })
    .default("all")
    .optional(),
});

export type GetStatisticsQuery = z.infer<typeof getStatisticsQuerySchema>;
