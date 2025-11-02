/**
 * Type definitions for Dashboard view components
 *
 * This file contains ViewModel types that extend DTOs with UI-specific state
 */

import type {
  NoteDTO,
  PaginationDTO,
  GraphDTO,
  GraphNodeDTO,
  GraphEdgeDTO
} from "@/types";

/**
 * Main state type for the entire Dashboard view
 */
export interface DashboardState {
  notes: NoteDTO[];
  pagination: PaginationDTO | null;
  isLoadingNotes: boolean;
  notesError: Error | null;

  graphData: GraphDTO | null;
  isLoadingGraph: boolean;
  graphError: Error | null;

  /**
   * Node that the graph is currently centered on
   */
  graphCenterNode: { id: string; type: 'note' | 'entity' } | null;

  /**
   * Current search term (for note title)
   */
  searchTerm: string;

  /**
   * Selected entity IDs for filtering
   */
  selectedEntityIds: string[];

  /**
   * Graph panel visibility state
   */
  graphPanelState: 'collapsed' | 'open' | 'fullscreen';
}

/**
 * ViewModel types for graph library, extending DTOs with UI state
 */
export type GraphNodeViewModel = GraphNodeDTO & {
  isSelected?: boolean;
  position?: { x: number; y: number }; // Required by some graph libraries
};

export interface GraphEdgeViewModel extends GraphEdgeDTO {
  isSelected?: boolean;
}
