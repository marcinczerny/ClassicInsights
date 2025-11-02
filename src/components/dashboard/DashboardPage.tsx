/**
 * DashboardPage component
 *
 * Main container component for the Dashboard view.
 * Manages overall state, layout, and communication between NotesPanel and GraphPanel.
 */

import { useDashboard } from "./hooks/useDashboard";
import { NotesPanel } from "./notes/NotesPanel";
import { GraphPanel } from "./graph/GraphPanel";

export function DashboardPage() {
  const {
    // Notes state
    notes,
    pagination,
    isLoadingNotes,
    notesError,
    searchTerm,

    // Graph state
    graphData,
    isLoadingGraph,
    graphError,
    graphPanelState,
    graphCenterNode,

    // Actions
    handleSearchChange,
    handlePageChange,
    handleNoteSelect,
    handleNodeSelect,
    handleCreateRelationship,
    setGraphPanelState,
  } = useDashboard();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Notes Panel - Left side */}
      <div className="w-96 flex-shrink-0">
        <NotesPanel
          notes={notes}
          pagination={pagination}
          isLoading={isLoadingNotes}
          error={notesError}
          searchTerm={searchTerm}
          selectedNoteId={graphCenterNode?.type === 'note' ? graphCenterNode.id : undefined}
          onSearchChange={handleSearchChange}
          onPageChange={handlePageChange}
          onNoteSelect={handleNoteSelect}
        />
      </div>

      {/* Graph Panel - Right side */}
      <div className="flex-1">
        <GraphPanel
          graphData={graphData}
          isLoading={isLoadingGraph}
          error={graphError}
          panelState={graphPanelState}
          hasNotes={notes.length > 0}
          graphCenterNode={graphCenterNode}
          onNodeSelect={handleNodeSelect}
          onCreateRelationship={handleCreateRelationship}
          onPanelStateChange={setGraphPanelState}
        />
      </div>
    </div>
  );
}
