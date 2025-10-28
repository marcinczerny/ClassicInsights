/**
 * Statistics Service
 * Handles aggregation and calculation of user statistics across the application
 *
 * Performance considerations:
 * - Parallel query execution using Promise.all
 * - Uses database aggregation functions (COUNT, GROUP BY)
 * - Leverages existing indexes on user_id and created_at columns
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { StatisticsDTO, SuggestionTypeStatsDTO } from "../../types";
import type { Enums } from "../../db/database.types";

/**
 * All possible entity types from the database schema
 */
const ALL_ENTITY_TYPES: Enums<"entity_type">[] = [
  "person",
  "work",
  "idea",
  "epoch",
  "school",
  "system",
  "other",
];

/**
 * All possible relationship types from the database schema
 */
const ALL_RELATIONSHIP_TYPES: Enums<"relationship_type">[] = [
  "criticizes",
  "is_student_of",
  "expands_on",
  "influenced_by",
  "is_example_of",
  "is_related_to",
];

/**
 * All possible suggestion types from the database schema
 */
const ALL_SUGGESTION_TYPES: Enums<"suggestion_type">[] = [
  "quote",
  "summary",
  "new_entity",
  "existing_entity_link",
];

/**
 * Calculates the boundary date based on the period parameter
 * @param period - Time period for filtering ("all", "week", "month", "year")
 * @returns Date boundary or null for "all" period
 */
function calculateDateBoundary(period: string): Date | null {
  if (period === "all") {
    return null;
  }

  const now = new Date();
  const boundary = new Date(now);

  switch (period) {
    case "week":
      boundary.setDate(now.getDate() - 7);
      break;
    case "month":
      boundary.setDate(now.getDate() - 30);
      break;
    case "year":
      boundary.setDate(now.getDate() - 365);
      break;
  }

  return boundary;
}

/**
 * Retrieves note statistics for a user
 * @param supabase - Supabase client instance
 * @param userId - User ID to get statistics for
 * @param dateBoundary - Date boundary for period filtering (null for all time)
 * @returns Note statistics with total and created_this_period counts
 */
async function getNotesStatistics(
  supabase: SupabaseClient,
  userId: string,
  dateBoundary: Date | null
): Promise<{ total: number; created_this_period: number }> {
  // Query 1: Total notes
  const { count: total, error: totalError } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (totalError) {
    console.error("Error fetching total notes:", totalError);
    throw new Error("Failed to fetch note statistics");
  }

  // Query 2: Notes created in period (if period filter is active)
  let createdThisPeriod = 0;
  if (dateBoundary) {
    const { count: periodCount, error: periodError } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", dateBoundary.toISOString());

    if (periodError) {
      console.error("Error fetching period notes:", periodError);
      throw new Error("Failed to fetch note statistics");
    }

    createdThisPeriod = periodCount || 0;
  } else {
    // If "all" period, created_this_period equals total
    createdThisPeriod = total || 0;
  }

  return {
    total: total || 0,
    created_this_period: createdThisPeriod,
  };
}

/**
 * Retrieves entity statistics grouped by type
 * @param supabase - Supabase client instance
 * @param userId - User ID to get statistics for
 * @returns Entity statistics with total count and breakdown by type
 */
async function getEntitiesStatistics(
  supabase: SupabaseClient,
  userId: string
): Promise<{ total: number; by_type: Record<Enums<"entity_type">, number> }> {
  const { data, error } = await supabase
    .from("entities")
    .select("type")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching entity statistics:", error);
    throw new Error("Failed to fetch entity statistics");
  }

  // Initialize all types with 0
  const byType: Record<Enums<"entity_type">, number> = {} as Record<Enums<"entity_type">, number>;
  ALL_ENTITY_TYPES.forEach((type) => {
    byType[type] = 0;
  });

  // Count occurrences of each type
  let total = 0;
  if (data) {
    data.forEach((row) => {
      byType[row.type as Enums<"entity_type">] = (byType[row.type as Enums<"entity_type">] || 0) + 1;
      total++;
    });
  }

  return {
    total,
    by_type: byType,
  };
}

/**
 * Retrieves relationship statistics grouped by type
 * @param supabase - Supabase client instance
 * @param userId - User ID to get statistics for
 * @returns Relationship statistics with total count and breakdown by type
 */
async function getRelationshipsStatistics(
  supabase: SupabaseClient,
  userId: string
): Promise<{ total: number; by_type: Record<Enums<"relationship_type">, number> }> {
  const { data, error } = await supabase
    .from("relationships")
    .select("type")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching relationship statistics:", error);
    throw new Error("Failed to fetch relationship statistics");
  }

  // Initialize all types with 0
  const byType: Record<Enums<"relationship_type">, number> = {} as Record<
    Enums<"relationship_type">,
    number
  >;
  ALL_RELATIONSHIP_TYPES.forEach((type) => {
    byType[type] = 0;
  });

  // Count occurrences of each type
  let total = 0;
  if (data) {
    data.forEach((row) => {
      byType[row.type as Enums<"relationship_type">] =
        (byType[row.type as Enums<"relationship_type">] || 0) + 1;
      total++;
    });
  }

  return {
    total,
    by_type: byType,
  };
}

/**
 * Retrieves AI suggestion statistics with acceptance rates
 * @param supabase - Supabase client instance
 * @param userId - User ID to get statistics for
 * @returns AI suggestion statistics with totals, acceptance rates, and breakdown by type
 */
async function getAISuggestionsStatistics(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  total_generated: number;
  total_accepted: number;
  total_rejected: number;
  acceptance_rate: number;
  by_type: Record<Enums<"suggestion_type">, SuggestionTypeStatsDTO>;
}> {
  const { data, error } = await supabase
    .from("ai_suggestions")
    .select("type, status")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching AI suggestion statistics:", error);
    throw new Error("Failed to fetch AI suggestion statistics");
  }

  // Initialize counters for overall statistics
  let totalGenerated = 0;
  let totalAccepted = 0;
  let totalRejected = 0;

  // Initialize by_type statistics
  const byType: Record<Enums<"suggestion_type">, SuggestionTypeStatsDTO> = {} as Record<
    Enums<"suggestion_type">,
    SuggestionTypeStatsDTO
  >;

  ALL_SUGGESTION_TYPES.forEach((type) => {
    byType[type] = {
      generated: 0,
      accepted: 0,
      acceptance_rate: 0,
    };
  });

  // Process data and count by type and status
  if (data) {
    data.forEach((row) => {
      const suggestionType = row.type as Enums<"suggestion_type">;

      totalGenerated++;
      byType[suggestionType].generated++;

      if (row.status === "accepted") {
        totalAccepted++;
        byType[suggestionType].accepted++;
      } else if (row.status === "rejected") {
        totalRejected++;
      }
    });
  }

  // Calculate acceptance rates
  const overallAcceptanceRate = totalGenerated > 0 ? totalAccepted / totalGenerated : 0;

  ALL_SUGGESTION_TYPES.forEach((type) => {
    const stats = byType[type];
    stats.acceptance_rate = stats.generated > 0 ? stats.accepted / stats.generated : 0;
  });

  return {
    total_generated: totalGenerated,
    total_accepted: totalAccepted,
    total_rejected: totalRejected,
    acceptance_rate: overallAcceptanceRate,
    by_type: byType,
  };
}

/**
 * Main function to retrieve comprehensive user statistics
 * Executes all statistic queries in parallel for optimal performance
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to get statistics for
 * @param period - Time period for created_this_period filtering
 * @returns Complete statistics DTO with all aggregated data
 */
export async function getUserStatistics(
  supabase: SupabaseClient,
  userId: string,
  period: string = "all"
): Promise<StatisticsDTO> {
  // Calculate date boundary for period filtering
  const dateBoundary = calculateDateBoundary(period);

  try {
    // Execute all queries in parallel for optimal performance
    const [notes, entities, relationships, aiSuggestions] = await Promise.all([
      getNotesStatistics(supabase, userId, dateBoundary),
      getEntitiesStatistics(supabase, userId),
      getRelationshipsStatistics(supabase, userId),
      getAISuggestionsStatistics(supabase, userId),
    ]);

    return {
      notes,
      entities,
      relationships,
      ai_suggestions: aiSuggestions,
    };
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    throw error;
  }
}
