import { useState, useCallback, useEffect, useMemo } from 'react';
import type { DashboardState, DashboardViewController } from '../types';
import type { NoteDTO } from '@/types';

const INITIAL_STATE: Omit<DashboardState, 'notes'> = {
  pagination: null,
  isLoadingNotes: true,
  notesError: null,
  graphData: null,
  isLoadingGraph: true,
  graphError: null,
  graphCenterNode: null,
  searchTerm: '',
  selectedEntityIds: [],
  graphPanelState: 'open',
};

export function useDashboard(): DashboardViewController {
  const [allNotes, setAllNotes] = useState<NoteDTO[]>([]);
  const [state, setState] = useState(INITIAL_STATE);
  const [graphCenterNode, setGraphCenterNode] = useState<{ id: string; type: 'note' | 'entity' } | null>(null);

  const fetchAllData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingNotes: true, isLoadingGraph: true }));
    try {
      const [notesRes, graphRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/graph'),
      ]);

      if (!notesRes.ok) throw new Error('Failed to fetch notes');
      if (!graphRes.ok) throw new Error('Failed to fetch graph data');

      const notes = await notesRes.json();
      const graphData = await graphRes.json();
      
      setAllNotes(notes);
      setState(prev => ({
        ...prev,
        graphData,
        isLoadingNotes: false,
        isLoadingGraph: false,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('An unknown error occurred');
      setState(prev => ({ ...prev, notesError: err, graphError: err, isLoadingNotes: false, isLoadingGraph: false }));
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredNotes = useMemo(() => {
    if (!state.searchTerm) return allNotes;
    const searchTerm = state.searchTerm.toLowerCase();
    return allNotes.filter(note =>
      note.title.toLowerCase().includes(searchTerm) ||
      (note.content && note.content.toLowerCase().includes(searchTerm))
    );
  }, [allNotes, state.searchTerm]);
  
  const handleSearchChange = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const handleNoteSelect = useCallback((noteId: string) => {
    setGraphCenterNode({ id: noteId, type: 'note' });
  }, []);

  const handleNodeSelect = useCallback((node: { id: string; type: 'note' | 'entity' }) => {
    setGraphCenterNode(node);
  }, []);

  const handleNoteDelete = useCallback(async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete note');
      
      // Refetch all data to ensure consistency
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting note:', error);
      // Optionally set an error state to show in the UI
    }
  }, [fetchAllData]);

  return {
    ...state,
    notes: filteredNotes,
    pagination: null, // Pagination is removed
    
    // Note actions
    handleSearchChange,
    handlePageChange: () => {},
    handleNoteDelete,
    handleNoteSelect,

    // Graph actions
    handleNodeSelect,
    handleCreateRelationship: async () => {},
    handleCreateNoteEntity: async () => {},
    setGraphPanelState: () => {},
    handleEntitySelectionChange: () => {},

    // State
    graphCenterNode,
    selectedEntityIds: [],
    graphPanelState: 'open',
  };
}
