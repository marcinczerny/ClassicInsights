import { useState, useCallback, useEffect, useMemo } from "react";
import type { DashboardState, DashboardViewController } from "../types";
import type { NoteDTO, CreateRelationshipCommand } from "@/types";
import type { Enums } from "@/db/database.types";

const INITIAL_STATE: Omit<DashboardState, "notes"> = {
  pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
  isLoadingNotes: true,
  notesError: null,
  graphData: null,
  isLoadingGraph: true,
  graphError: null,
  graphCenterNode: null,
  selectedNodeId: null,
  searchTerm: "",
  selectedEntityIds: [],
  graphPanelState: "open" as const,
};

export function useDashboard(): DashboardViewController {
  const [allNotes, setAllNotes] = useState<NoteDTO[]>([]);
  const [state, setState] = useState(INITIAL_STATE);
  const [graphCenterNode, setGraphCenterNode] = useState<{
    id: string;
    type: "note" | "entity";
  } | null>(null);
  const [graphPanelState, setGraphPanelState] = useState<"collapsed" | "open" | "fullscreen">(
    "open"
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingNotes: true }));
    try {
      const params = new URLSearchParams({
        page: state.pagination.page.toString(),
        limit: state.pagination.limit.toString(),
        sort: "created_at",
        order: "desc",
        ...(state.searchTerm && { search: state.searchTerm }),
        ...(state.selectedEntityIds.length > 0 && { entities: state.selectedEntityIds.join(",") }),
      });

      const notesRes = await fetch(`/api/notes?${params}`);
      if (!notesRes.ok) throw new Error("Failed to fetch notes");
      const notesResponse = await notesRes.json();
      setAllNotes(notesResponse.data);
      setState((prev) => ({
        ...prev,
        pagination: notesResponse.pagination,
        isLoadingNotes: false,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error("An unknown error occurred");
      setState((prev) => ({
        ...prev,
        notesError: err,
        isLoadingNotes: false,
      }));
    }
  }, [state.pagination.page, state.pagination.limit, state.searchTerm, state.selectedEntityIds]);

  const fetchGraphData = useCallback(async () => {
    if (!graphCenterNode) {
      setState((prev) => ({ ...prev, graphData: { nodes: [], edges: [] } }));
      return;
    }
    setState((prev) => ({ ...prev, isLoadingGraph: true }));
    try {
      const res = await fetch(`/api/graph?centerNodeId=${graphCenterNode.id}`);
      if (!res.ok) throw new Error("Failed to fetch graph data");
      const graphData = await res.json();
      setState((prev) => ({ ...prev, graphData, isLoadingGraph: false, graphError: null }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error("An unknown error occurred");
      setState((prev) => ({
        ...prev,
        graphError: err,
        isLoadingGraph: false,
      }));
    }
  }, [graphCenterNode]);

  useEffect(() => {
    fetchAllData();
  }, [state.pagination.page, state.pagination.limit, state.searchTerm, state.selectedEntityIds]);

  useEffect(() => {
    // If there's no center node yet, and we have notes, set the first note as the center.
    if (!graphCenterNode && allNotes.length > 0) {
      setGraphCenterNode({ id: allNotes[0].id, type: "note" });
    }
  }, [allNotes, graphCenterNode]);

  useEffect(() => {
    fetchGraphData();
  }, [graphCenterNode, fetchGraphData]);

  const handleRelationshipDelete = useCallback(
    async (relationshipId: string) => {
      try {
        const response = await fetch(`/api/relationships/${relationshipId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete relationship");
        }
        await fetchGraphData();
      } catch (error) {
        console.error("Error deleting relationship:", error);
        // TODO: show error toast
      }
    },
    [fetchGraphData]
  );

  const handleNoteEntityDelete = useCallback(
    async (noteId: string, entityId: string) => {
      try {
        const response = await fetch(`/api/notes/${noteId}/entities/${entityId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete note-entity association");
        }
        await fetchGraphData();
      } catch (error) {
        console.error("Error deleting note-entity association:", error);
        // TODO: show error toast
      }
    },
    [fetchGraphData]
  );

  const filteredNotes = useMemo(() => {
    if (!state.searchTerm) return allNotes;
    const searchTerm = state.searchTerm.toLowerCase();
    return allNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchTerm) ||
        (note.content && note.content.toLowerCase().includes(searchTerm))
    );
  }, [allNotes, state.searchTerm]);

  const handleSearchChange = useCallback((term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  }, []);

  const handleNoteSelect = useCallback((noteId: string) => {
    setGraphCenterNode({ id: noteId, type: "note" });
  }, []);

  const handleNodeSelect = useCallback((node: { id: string; type: "note" | "entity" }) => {
    setGraphCenterNode(node);
  }, []);

  const handleNoteDelete = useCallback(
    async (noteId: string) => {
      try {
        const response = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete note");

        // Refetch all data to ensure consistency
        await fetchAllData();
      } catch (error) {
        console.error("Error deleting note:", error);
        // Optionally set an error state to show in the UI
      }
    },
    [fetchAllData]
  );

  return {
    ...state,
    notes: filteredNotes,

    // Note actions
    handleSearchChange,
    handlePageChange,
    handleNoteDelete,
    handleNoteSelect,

    // Graph actions
    handleNodeSelect,
    handleNodeSelection: setSelectedNodeId,
    handleCreateRelationship: async (command: CreateRelationshipCommand) => {
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

        // Refresh graph data after creating relationship
        await fetchGraphData();
      } catch (error) {
        console.error("Error creating relationship:", error);
        throw error;
      }
    },
    handleCreateNoteEntity: async (
      noteId: string,
      entityId: string,
      relationshipType: Enums<"relationship_type">
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

        // Refresh graph data after creating association
        await fetchGraphData();
      } catch (error) {
        console.error("Error creating note-entity association:", error);
        throw error;
      }
    },
    handleRelationshipDelete,
    handleNoteEntityDelete,
    setGraphPanelState,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleEntitySelectionChange: (_entityIds: string[]) => {
      // TODO: Implement entity selection change handling
      throw new Error("handleEntitySelectionChange not implemented");
    },

    // State
    graphCenterNode,
    selectedNodeId,
    selectedEntityIds: [],
    graphPanelState,
  };
}
