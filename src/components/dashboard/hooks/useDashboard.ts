/**
 * Custom hook for managing Dashboard state and interactions
 *
 * Encapsulates all state management, data fetching, and side effects logic
 * for the Dashboard view, keeping components clean and logic reusable.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { DashboardState } from "../types";
import type { CreateRelationshipCommand } from "@/types";

const INITIAL_STATE: DashboardState = {
  notes: [],
  pagination: null,
  isLoadingNotes: false,
  notesError: null,

  graphData: null,
  isLoadingGraph: false,
  graphError: null,

  graphCenterNode: null,
  searchTerm: "",
  graphPanelState: "open",
};

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const hasInitiallyLoadedGraph = useRef(false);

  /**
   * Fetch notes from API
   */
  const fetchNotes = useCallback(async (page: number = 1, search: string = "") => {
    setState((prev) => ({ ...prev, isLoadingNotes: true, notesError: null }));

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      });

      const response = await fetch(`/api/notes?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        notes: data.data,
        pagination: data.pagination,
        isLoadingNotes: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoadingNotes: false,
        notesError: error instanceof Error ? error : new Error("Unknown error"),
      }));
    }
  }, []);

  /**
   * Fetch graph data from API
   */
  const fetchGraph = useCallback(async (centerNode: { id: string; type: 'note' | 'entity' } | null = null) => {
    // Don't fetch if no center node is provided
    if (!centerNode) {
      setState((prev) => ({ ...prev, isLoadingGraph: false, graphData: null, graphError: null }));
      return;
    }

    setState((prev) => ({ ...prev, isLoadingGraph: true, graphError: null }));

    try {
      const params = new URLSearchParams({
        levels: "2",
        center_id: centerNode.id,
        center_type: centerNode.type,
      });

      const response = await fetch(`/api/graph?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch graph");
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        graphData: data,
        graphCenterNode: centerNode,
        isLoadingGraph: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoadingGraph: false,
        graphError: error instanceof Error ? error : new Error("Unknown error"),
      }));
    }
  }, []);

  /**
   * Handle search term change with debouncing
   */
  const handleSearchChange = useCallback((term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  /**
   * Handle page change in pagination
   */
  const handlePageChange = useCallback((page: number) => {
    fetchNotes(page, state.searchTerm);
  }, [fetchNotes, state.searchTerm]);

  /**
   * Handle note selection from list - centers graph on selected note
   */
  const handleNoteSelect = useCallback((noteId: string) => {
    fetchGraph({ id: noteId, type: 'note' });
  }, [fetchGraph]);

  /**
   * Handle node selection in graph - reloads graph centered on selected node
   */
  const handleNodeSelect = useCallback((node: { id: string; type: 'note' | 'entity' }) => {
    fetchGraph(node);
  }, [fetchGraph]);

  /**
   * Create a new relationship between entities
   */
  const handleCreateRelationship = useCallback(async (command: CreateRelationshipCommand) => {
    try {
      const response = await fetch("/api/relationships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error("Failed to create relationship");
      }

      // Refresh graph after creating relationship
      if (state.graphCenterNode) {
        await fetchGraph(state.graphCenterNode);
      }
    } catch (error) {
      console.error("Error creating relationship:", error);
      throw error;
    }
  }, [fetchGraph, state.graphCenterNode]);

  /**
   * Create a new note-entity association
   */
  const handleCreateNoteEntity = useCallback(async (
    noteId: string,
    entityId: string,
    relationshipType: string
  ) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/entities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_id: entityId,
          relationship_type: relationshipType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note-entity association");
      }

      // Refresh graph after creating association
      if (state.graphCenterNode) {
        await fetchGraph(state.graphCenterNode);
      }
    } catch (error) {
      console.error("Error creating note-entity association:", error);
      throw error;
    }
  }, [fetchGraph, state.graphCenterNode]);

  /**
   * Set graph panel visibility state
   */
  const setGraphPanelState = useCallback((panelState: DashboardState['graphPanelState']) => {
    setState((prev) => ({ ...prev, graphPanelState: panelState }));
  }, []);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchNotes(1, "");
    // Graph will be loaded after notes are fetched
  }, [fetchNotes]);

  /**
   * Auto-load graph centered on first note when notes are loaded for the first time only
   * This should not run when search term changes - graph should stay on current node
   */
  useEffect(() => {
    // Only auto-select on initial load:
    // 1. Notes are loaded
    // 2. There are notes available
    // 3. Haven't loaded graph yet (tracked by ref)
    if (!state.isLoadingNotes && state.notes.length > 0 && !hasInitiallyLoadedGraph.current) {
      const firstNote = state.notes[0];
      fetchGraph({ id: firstNote.id, type: 'note' });
      hasInitiallyLoadedGraph.current = true;
    }
  }, [state.isLoadingNotes, state.notes.length, fetchGraph]);

  /**
   * Debounced search effect
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.searchTerm.length >= 2 || state.searchTerm === "") {
        fetchNotes(1, state.searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.searchTerm, fetchNotes]);

  return {
    // State
    notes: state.notes,
    pagination: state.pagination,
    isLoadingNotes: state.isLoadingNotes,
    notesError: state.notesError,

    graphData: state.graphData,
    isLoadingGraph: state.isLoadingGraph,
    graphError: state.graphError,

    graphCenterNode: state.graphCenterNode,
    searchTerm: state.searchTerm,
    graphPanelState: state.graphPanelState,

    // Actions
    fetchNotes,
    fetchGraph,
    handleSearchChange,
    handlePageChange,
    handleNoteSelect,
    handleNodeSelect,
    handleCreateRelationship,
    handleCreateNoteEntity,
    setGraphPanelState,
  };
}
