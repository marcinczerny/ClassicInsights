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
  GraphEdgeDTO,
  CreateRelationshipCommand,
} from "@/types";

/**
 * Main state type for the entire Dashboard view
 */
export interface DashboardState {
  notes: NoteDTO[];
  pagination: PaginationDTO;
  isLoadingNotes: boolean;
  notesError: Error | null;

  graphData: GraphDTO | null;
  isLoadingGraph: boolean;
  graphError: Error | null;

  /**
   * Node that the graph is currently centered on
   */
  graphCenterNode: { id: string; type: "note" | "entity" } | null;

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
  graphPanelState: "collapsed" | "open" | "fullscreen";
}

/**
 * Controller interface for Dashboard view interactions
 */
export interface DashboardViewController extends DashboardState {
  // Note actions
  handleSearchChange: (term: string) => void;
  handlePageChange: (page: number) => void;
  handleNoteSelect: (noteId: string) => void;
  handleNoteDelete: (noteId: string) => Promise<void>;

  // Entity actions
  handleEntitySelectionChange: (entityIds: string[]) => void;

  // Graph actions
  handleNodeSelect: (node: { id: string; type: "note" | "entity" }) => void;
  handleCreateRelationship: (command: CreateRelationshipCommand) => Promise<void>;
  handleCreateNoteEntity: (noteId: string, entityName: string) => Promise<void>;
  setGraphPanelState: (state: "collapsed" | "open" | "fullscreen") => void;
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
