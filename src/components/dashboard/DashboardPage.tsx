/**
 * DashboardPage component
 *
 * Main container component for the Dashboard view.
 * Manages overall state, layout, and communication between NotesPanel and GraphPanel.
 */

import { useState, useEffect } from "react";
import { useDashboard } from "./hooks/useDashboard";
import { NotesPanel } from "./notes/NotesPanel";
import { GraphPanel } from "./graph/GraphPanel";
import { OnboardingModal } from "../onboarding/OnboardingModal";
import { useSessionStorage } from "../onboarding/useSessionStorage";

export function DashboardPage() {
  const {
    // Notes state
    notes,
    pagination,
    isLoadingNotes,
    notesError,
    searchTerm,
    selectedEntityIds,

    // Graph state
    graphData,
    isLoadingGraph,
    graphError,
    graphPanelState,
    graphCenterNode,

    // Actions
    handleSearchChange,
    handleEntitySelectionChange,
    handlePageChange,
    handleNoteSelect,
    handleNodeSelect,
    handleCreateRelationship,
    handleCreateNoteEntity,
    handleNoteDelete,
    setGraphPanelState,
  } = useDashboard();

  // Onboarding modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useSessionStorage('onboardingDismissed', false);

  // Show onboarding modal for new users with no notes
  useEffect(() => {
    if (!onboardingDismissed && !isLoadingNotes && pagination?.total === 0) {
      setIsModalOpen(true);
    }
  }, [onboardingDismissed, isLoadingNotes, pagination?.total]);

  // Handle CTA click - navigate to create note page
  const handleCtaClick = () => {
    setIsModalOpen(false);
    window.location.href = '/notes/new';
  };

  // Handle modal close
  const handleModalClose = () => {
    setOnboardingDismissed(true);
    setIsModalOpen(false);
  };

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
          selectedEntityIds={selectedEntityIds}
          selectedNoteId={graphCenterNode?.type === 'note' ? graphCenterNode.id : undefined}
          onSearchChange={handleSearchChange}
          onEntitySelectionChange={handleEntitySelectionChange}
          onPageChange={handlePageChange}
          onNoteSelect={handleNoteSelect}
          onNoteDelete={handleNoteDelete}
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
          onCreateNoteEntity={handleCreateNoteEntity}
          onPanelStateChange={setGraphPanelState}
        />
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onCtaClick={handleCtaClick}
      />
    </div>
  );
}
