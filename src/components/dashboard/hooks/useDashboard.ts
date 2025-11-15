import { useState, useCallback, useEffect, useMemo } from "react";
import type { DashboardState, DashboardViewController } from "../types";
import type { NoteDTO, CreateRelationshipCommand } from "@/types";

const INITIAL_STATE: Omit<DashboardState, "notes"> = {
  pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
  isLoadingNotes: true,
  notesError: null,
  graphData: null,
  isLoadingGraph: true,
  graphError: null,
  graphCenterNode: null,
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

  const fetchAllData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingNotes: true, isLoadingGraph: true }));
    try {
      const params = new URLSearchParams({
        page: state.pagination.page.toString(),
        limit: state.pagination.limit.toString(),
        sort: "created_at",
        order: "desc",
        ...(state.searchTerm && { search: state.searchTerm }),
        ...(state.selectedEntityIds.length > 0 && { entities: state.selectedEntityIds.join(",") }),
      });

      const [notesRes, graphRes] = await Promise.all([
        fetch(`/api/notes?${params}`),
        fetch("/api/graph"),
      ]);

      if (!notesRes.ok) throw new Error("Failed to fetch notes");
      if (!graphRes.ok) throw new Error("Failed to fetch graph data");

      const notesResponse = await notesRes.json();
      const graphData = await graphRes.json();

      setAllNotes(notesResponse.data);
      setState((prev) => ({
        ...prev,
        pagination: notesResponse.pagination,
        graphData,
        isLoadingNotes: false,
        isLoadingGraph: false,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error("An unknown error occurred");
      setState((prev) => ({
        ...prev,
        notesError: err,
        graphError: err,
        isLoadingNotes: false,
        isLoadingGraph: false,
      }));
    }
  }, [state.pagination.page, state.pagination.limit, state.searchTerm, state.selectedEntityIds]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
        await fetchAllData();
      } catch (error) {
        console.error("Error creating relationship:", error);
        throw error;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleCreateNoteEntity: async (_noteId: string, _entityName: string) => {
      // TODO: Implement note-entity creation
      throw new Error("handleCreateNoteEntity not implemented");
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setGraphPanelState: (_state: "collapsed" | "open" | "fullscreen") => {
      // TODO: Implement graph panel state management
      throw new Error("setGraphPanelState not implemented");
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleEntitySelectionChange: (_entityIds: string[]) => {
      // TODO: Implement entity selection change handling
      throw new Error("handleEntitySelectionChange not implemented");
    },

    // State
    graphCenterNode,
    selectedEntityIds: [],
    graphPanelState: "open",
  };
}
