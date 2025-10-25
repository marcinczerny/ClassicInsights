/**
 * Type definitions for DTOs (Data Transfer Objects) and Command Models
 * 
 * This file contains all type definitions used for API requests and responses.
 * All types are derived from database table definitions to ensure type safety.
 */

import type { Tables, Enums } from "./db/database.types";

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export type PaginationDTO = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

/**
 * Standard error response format
 */
export type ErrorDTO = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

/**
 * User profile (GET /api/profile response)
 * Directly maps to the profiles table
 */
export type ProfileDTO = Tables<"profiles">;

/**
 * Command to update user profile (PATCH /api/profile request)
 * Only has_agreed_to_ai_data_processing can be updated
 */
export type UpdateProfileCommand = {
  has_agreed_to_ai_data_processing?: boolean;
};

// ============================================================================
// ENTITY TYPES
// ============================================================================

/**
 * Basic entity information
 * Full entity record from the database
 */
export type EntityDTO = Tables<"entities">;

/**
 * Subset of entity fields for embedding in other DTOs
 * Used when including entity info in notes or relationships
 */
export type EntityBasicDTO = Pick<
  EntityDTO,
  "id" | "name" | "type" | "description"
>;

/**
 * Entity with note count for list views (GET /api/entities response)
 * Extends basic entity with aggregated note count
 */
export type EntityWithCountDTO = EntityDTO & {
  note_count: number;
};

/**
 * Preview of a note for entity details
 * Minimal note information for display in entity context
 */
export type NotePreviewDTO = Pick<
  Tables<"notes">,
  "id" | "title" | "created_at"
>;

/**
 * Entity with associated notes (GET /api/entities/:id response)
 * Full entity with list of related notes
 */
export type EntityWithNotesDTO = EntityDTO & {
  notes: NotePreviewDTO[];
};

/**
 * Command to create a new entity (POST /api/entities request)
 * Omits auto-generated fields (id, timestamps, user_id)
 */
export type CreateEntityCommand = {
  name: string;
  type: Enums<"entity_type">;
  description?: string;
};

/**
 * Command to update an entity (PATCH /api/entities/:id request)
 * All fields are optional for partial updates
 */
export type UpdateEntityCommand = {
  name?: string;
  type?: Enums<"entity_type">;
  description?: string;
};

/**
 * List of entities response (GET /api/entities response)
 */
export type EntitiesListResponseDTO = {
  data: EntityWithCountDTO[];
  pagination: PaginationDTO;
};

// ============================================================================
// NOTE TYPES
// ============================================================================

/**
 * Note with associated entities (GET /api/notes/:id response)
 * Full note record with embedded entity information
 */
export type NoteDTO = Tables<"notes"> & {
  entities: EntityBasicDTO[];
};

/**
 * Command to create a new note (POST /api/notes request)
 * Omits auto-generated fields (id, timestamps, user_id)
 */
export type CreateNoteCommand = {
  title: string;
  content?: string;
  entity_ids?: string[];
};

/**
 * Command to update a note (PATCH /api/notes/:id request)
 * All fields are optional for partial updates
 */
export type UpdateNoteCommand = {
  title?: string;
  content?: string;
  entity_ids?: string[];
};

/**
 * Paginated list of notes response (GET /api/notes response)
 */
export type NotesListResponseDTO = {
  data: NoteDTO[];
  pagination: PaginationDTO;
};

/**
 * Command to add entity to note (POST /api/notes/:id/entities request)
 */
export type AddEntityToNoteCommand = {
  entity_id: string;
};

/**
 * Note-entity association response (POST /api/notes/:id/entities response)
 * Represents the junction table record
 */
export type NoteEntityAssociationDTO = Tables<"note_entities">;

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

/**
 * Basic relationship between entities
 * Direct mapping from relationships table
 */
export type RelationshipDTO = Tables<"relationships">;

/**
 * Relationship with full entity details (GET /api/relationships response)
 * Includes complete information about both source and target entities
 */
export type RelationshipWithEntitiesDTO = RelationshipDTO & {
  source_entity: EntityBasicDTO;
  target_entity: EntityBasicDTO;
};

/**
 * Command to create a relationship (POST /api/relationships request)
 * Omits auto-generated fields (id, created_at, user_id)
 */
export type CreateRelationshipCommand = {
  source_entity_id: string;
  target_entity_id: string;
  type: Enums<"relationship_type">;
};

/**
 * Command to update a relationship (PATCH /api/relationships/:id request)
 * Only the type can be updated
 */
export type UpdateRelationshipCommand = {
  type: Enums<"relationship_type">;
};

/**
 * List of relationships response (GET /api/relationships response)
 */
export type RelationshipsListResponseDTO = {
  data: RelationshipWithEntitiesDTO[];
};

// ============================================================================
// AI SUGGESTION TYPES
// ============================================================================

/**
 * Full AI suggestion record
 * Direct mapping from ai_suggestions table
 */
export type SuggestionDTO = Tables<"ai_suggestions">;

/**
 * Suggestion preview for analyze response (POST /api/notes/:id/analyze)
 * Subset of suggestion fields returned immediately after analysis
 */
export type SuggestionPreviewDTO = Pick<
  SuggestionDTO,
  "id" | "type" | "status" | "name" | "content" | "suggested_entity_id" | "created_at"
>;

/**
 * Response from note analysis (POST /api/notes/:id/analyze response)
 * Contains generated suggestions and timing metrics
 */
export type AnalyzeNoteResponseDTO = {
  note_id: string;
  suggestions: SuggestionPreviewDTO[];
  generation_duration_ms: number;
};

/**
 * Command to update suggestion status (PATCH /api/suggestions/:id request)
 * Only status transitions from pending to accepted/rejected are allowed
 */
export type UpdateSuggestionCommand = {
  status: "accepted" | "rejected";
};

/**
 * List of suggestions response (GET /api/notes/:id/suggestions response)
 */
export type SuggestionsListResponseDTO = {
  data: SuggestionDTO[];
};

// ============================================================================
// GRAPH TYPES
// ============================================================================

/**
 * Node in the thought graph visualization
 * Can represent either an entity or a note
 * 
 * @property type - Discriminator field for node type
 * @property entity_type - Only present when type is "entity"
 * @property description - Only present when type is "entity"
 * @property note_preview - Only present when type is "note"
 */
export type GraphNodeDTO = {
  id: string;
  type: "entity" | "note";
  name: string;
  created_at: string;
} & (
  | {
      type: "entity";
      entity_type: Enums<"entity_type">;
      description: string | null;
      note_preview?: never;
    }
  | {
      type: "note";
      entity_type?: never;
      description?: never;
      note_preview?: string;
    }
);

/**
 * Edge in the thought graph visualization
 * Represents either entity-entity relationship or note-entity association
 * 
 * @property type - Either a relationship_type enum or "note_entity" for note-entity links
 */
export type GraphEdgeDTO = {
  id: string;
  source_id: string;
  target_id: string;
  type: Enums<"relationship_type"> | "note_entity";
  created_at: string;
};

/**
 * Complete graph structure (GET /api/graph response)
 * Contains all nodes and edges for visualization
 */
export type GraphDTO = {
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
};

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Statistics for a specific suggestion type
 * Includes counts and calculated acceptance rate
 */
export type SuggestionTypeStatsDTO = {
  generated: number;
  accepted: number;
  acceptance_rate: number;
};

/**
 * Comprehensive user statistics (GET /api/statistics response)
 * Aggregated metrics about notes, entities, relationships, and AI suggestions
 */
export type StatisticsDTO = {
  notes: {
    total: number;
    created_this_period: number;
  };
  entities: {
    total: number;
    by_type: Record<Enums<"entity_type">, number>;
  };
  relationships: {
    total: number;
    by_type: Record<Enums<"relationship_type">, number>;
  };
  ai_suggestions: {
    total_generated: number;
    total_accepted: number;
    total_rejected: number;
    acceptance_rate: number;
    by_type: Record<Enums<"suggestion_type">, SuggestionTypeStatsDTO>;
  };
};

// ============================================================================
// TYPE GUARDS (Utility functions for type narrowing)
// ============================================================================

/**
 * Type guard to check if a graph node is an entity node
 */
export function isEntityNode(node: GraphNodeDTO): node is GraphNodeDTO & { type: "entity" } {
  return node.type === "entity";
}

/**
 * Type guard to check if a graph node is a note node
 */
export function isNoteNode(node: GraphNodeDTO): node is GraphNodeDTO & { type: "note" } {
  return node.type === "note";
}

/**
 * Type guard to check if a graph edge is a relationship edge
 */
export function isRelationshipEdge(
  edge: GraphEdgeDTO
): edge is GraphEdgeDTO & { type: Enums<"relationship_type"> } {
  return edge.type !== "note_entity";
}

/**
 * Type guard to check if a graph edge is a note-entity association edge
 */
export function isNoteEntityEdge(
  edge: GraphEdgeDTO
): edge is GraphEdgeDTO & { type: "note_entity" } {
  return edge.type === "note_entity";
}

