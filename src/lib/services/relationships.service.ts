/**
 * Service for managing entity relationships
 * Handles all business logic for relationship CRUD operations
 */

import { handleSupabaseError, type SupabaseClient } from "../../db/supabase.client";
import type {
  RelationshipDTO,
  RelationshipsListResponseDTO,
  CreateRelationshipCommand,
  UpdateRelationshipCommand,
} from "../../types";
import type { GetRelationshipsQuery } from "../validation/relationships.validation";

/**
 * Retrieves relationships with optional filtering and pagination
 * @param supabase - Authenticated Supabase client
 * @param userId - The ID of the user requesting relationships
 * @param params - Query parameters including pagination and filters
 * @returns Paginated list of relationships with full entity details
 */
export async function getRelationships(
  supabase: SupabaseClient,
  userId: string,
  params: GetRelationshipsQuery
): Promise<RelationshipsListResponseDTO> {
  const { page, limit, source_entity_id, target_entity_id, type } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("relationships")
    .select(
      `
			id,
			user_id,
			source_entity_id,
			target_entity_id,
			type,
			created_at,
			source_entity:entities!relationships_source_entity_id_fkey(
				id,
				name,
				type,
				description
			),
			target_entity:entities!relationships_target_entity_id_fkey(
				id,
				name,
				type,
				description
			)
		`,
      { count: "exact" }
    )
    .eq("user_id", userId);

  // Apply filters
  if (source_entity_id) {
    query = query.eq("source_entity_id", source_entity_id);
  }

  if (target_entity_id) {
    query = query.eq("target_entity_id", target_entity_id);
  }

  if (type) {
    query = query.eq("type", type);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    handleSupabaseError(error);
  }

  // Transform the data to match RelationshipWithEntitiesDTO
  const relationships = data.map((relationship) => ({
    id: relationship.id,
    user_id: relationship.user_id,
    source_entity_id: relationship.source_entity_id,
    target_entity_id: relationship.target_entity_id,
    type: relationship.type,
    created_at: relationship.created_at,
    source_entity: Array.isArray(relationship.source_entity)
      ? relationship.source_entity[0]
      : relationship.source_entity,
    target_entity: Array.isArray(relationship.target_entity)
      ? relationship.target_entity[0]
      : relationship.target_entity,
  }));

  const total = count ?? 0;
  const total_pages = Math.ceil(total / limit);

  return {
    data: relationships,
    pagination: {
      page,
      limit,
      total,
      total_pages,
    },
  };
}

/**
 * Creates a new relationship between two entities
 * @param supabase - Authenticated Supabase client
 * @param userId - The ID of the user creating the relationship
 * @param data - Relationship creation data
 * @returns The newly created relationship
 * @throws Error if entities don't exist, don't belong to user, or relationship is self-referential
 */
export async function createRelationship(
  supabase: SupabaseClient,
  userId: string,
  data: CreateRelationshipCommand
): Promise<RelationshipDTO> {
  // Validate that source and target are different
  if (data.source_entity_id === data.target_entity_id) {
    throw new Error("Cannot create a relationship from an entity to itself");
  }

  // Verify both entities exist and belong to the user
  const { data: entities, error: entitiesError } = await supabase
    .from("entities")
    .select("id")
    .eq("user_id", userId)
    .in("id", [data.source_entity_id, data.target_entity_id]);

  if (entitiesError) {
    handleSupabaseError(entitiesError);
  }

  if (!entities || entities.length !== 2) {
    throw new Error("One or both entities not found or do not belong to user");
  }

  // Insert the relationship
  const { data: relationship, error: insertError } = await supabase
    .from("relationships")
    .insert({
      user_id: userId,
      source_entity_id: data.source_entity_id,
      target_entity_id: data.target_entity_id,
      type: data.type,
    })
    .select()
    .single();

  if (insertError) {
    // Check if it's a duplicate key error
    if (insertError.code === "23505") {
      throw new Error("A relationship between these entities already exists");
    }
    handleSupabaseError(insertError);
  }

  return relationship;
}

/**
 * Updates an existing relationship's type
 * @param supabase - Authenticated Supabase client
 * @param userId - The ID of the user updating the relationship
 * @param relationshipId - The ID of the relationship to update
 * @param data - Update data (only type can be updated)
 * @returns The updated relationship
 * @throws Error if relationship doesn't exist or doesn't belong to user
 */
export async function updateRelationship(
  supabase: SupabaseClient,
  userId: string,
  relationshipId: string,
  data: UpdateRelationshipCommand
): Promise<RelationshipDTO> {
  const { data: relationship, error } = await supabase
    .from("relationships")
    .update({ type: data.type })
    .eq("id", relationshipId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    // Check if no rows were affected (relationship not found or doesn't belong to user)
    if (error.code === "PGRST116") {
      throw new Error("Relationship not found or access denied");
    }
    handleSupabaseError(error);
  }

  return relationship;
}

/**
 * Deletes a relationship
 * @param supabase - Authenticated Supabase client
 * @param userId - The ID of the user deleting the relationship
 * @param relationshipId - The ID of the relationship to delete
 * @throws Error if relationship doesn't exist or doesn't belong to user
 */
export async function deleteRelationship(
  supabase: SupabaseClient,
  userId: string,
  relationshipId: string
): Promise<void> {
  const { error, count } = await supabase
    .from("relationships")
    .delete({ count: "exact" })
    .eq("id", relationshipId)
    .eq("user_id", userId);

  if (error) {
    handleSupabaseError(error);
  }

  if (count === 0) {
    throw new Error("Relationship not found or access denied");
  }
}
