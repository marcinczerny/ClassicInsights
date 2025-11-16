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
import { ReactFlowProvider } from "@xyflow/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "../layout/ThemeToggle";
import { UserProfileDropdown } from "../layout/UserProfileDropdown";
import { EntitiesPage } from "../entities/EntitiesPage";

// This temporary user type is based on Astro.locals and what TopNavigationBar expects
interface User {
  email?: string;
  id: string;
}
interface DashboardPageProps {
  user: User | null;
}

export function DashboardPage({ user }: DashboardPageProps) {
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
    selectedNodeId,

    // Actions
    handleSearchChange,
    handleEntitySelectionChange,
    handlePageChange,
    handleNoteSelect,
    handleNodeSelect,
    handleNodeSelection,
    handleCreateRelationship,
    handleCreateNoteEntity,
    handleRelationshipDelete,
    handleNoteEntityDelete,
    handleNoteDelete,
    setGraphPanelState,
  } = useDashboard();

  // Onboarding modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useSessionStorage(
    "onboardingDismissed",
    false
  );

  // Show onboarding modal for new users with no notes
  // Skip onboarding in E2E test environments (localhost:3007)
  useEffect(() => {
    const isE2eTest = typeof window !== "undefined" && window.location.port === "3007";
    if (!onboardingDismissed && !isLoadingNotes && notes.length === 0 && !isE2eTest) {
      setIsModalOpen(true);
    }
  }, [onboardingDismissed, isLoadingNotes, notes.length]);

  // Handle CTA click - navigate to create note page
  const handleCtaClick = () => {
    setIsModalOpen(false);
    window.location.href = "/notes/new";
  };

  // Handle modal close
  const handleModalClose = () => {
    setOnboardingDismissed(true);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Desktop view */}
      <div className="hidden h-screen w-full overflow-hidden md:flex">
        {/* Notes Panel - Left side */}
        <div className="w-96 flex-shrink-0">
          <NotesPanel
            notes={notes}
            pagination={pagination}
            isLoading={isLoadingNotes}
            error={notesError}
            searchTerm={searchTerm}
            selectedEntityIds={selectedEntityIds}
            selectedNoteId={graphCenterNode?.type === "note" ? graphCenterNode.id : undefined}
            onSearchChange={handleSearchChange}
            onEntitySelectionChange={handleEntitySelectionChange}
            onPageChange={handlePageChange}
            onNoteSelect={handleNoteSelect}
            onNoteDelete={handleNoteDelete}
          />
        </div>

        {/* Graph Panel - Right side */}
        <div className="flex-1">
          <ReactFlowProvider>
            <GraphPanel
              graphData={graphData}
              isLoading={isLoadingGraph}
              error={graphError}
              panelState={graphPanelState}
              hasNotes={notes.length > 0}
              graphCenterNode={graphCenterNode}
              selectedNodeId={selectedNodeId}
              onNodeSelect={handleNodeSelect}
              onNodeSelection={handleNodeSelection}
              onCreateRelationship={handleCreateRelationship}
              onCreateNoteEntity={handleCreateNoteEntity}
              onRelationshipDelete={handleRelationshipDelete}
              onNoteEntityDelete={handleNoteEntityDelete}
              onPanelStateChange={setGraphPanelState}
            />
          </ReactFlowProvider>
        </div>
      </div>

      {/* Mobile view */}
      <div className="flex h-dvh w-full flex-col md:hidden">
        {/* Mobile header */}
        <div className="container flex h-14 flex-shrink-0 items-center justify-between px-4">
          <ThemeToggle />
          {user && <UserProfileDropdown user={user} />}
        </div>
        <Tabs defaultValue="notes" className="flex w-full flex-grow flex-col overflow-hidden">
          <TabsContent value="notes" className="flex-grow overflow-auto">
            <NotesPanel
              notes={notes}
              pagination={pagination}
              isLoading={isLoadingNotes}
              error={notesError}
              searchTerm={searchTerm}
              selectedEntityIds={selectedEntityIds}
              selectedNoteId={graphCenterNode?.type === "note" ? graphCenterNode.id : undefined}
              onSearchChange={handleSearchChange}
              onEntitySelectionChange={handleEntitySelectionChange}
              onPageChange={handlePageChange}
              onNoteSelect={handleNoteSelect}
              onNoteDelete={handleNoteDelete}
            />
          </TabsContent>
          <TabsContent value="graph" className="h-full flex-grow">
            <ReactFlowProvider>
              <GraphPanel
                graphData={graphData}
                isLoading={isLoadingGraph}
                error={graphError}
                panelState={graphPanelState}
                hasNotes={notes.length > 0}
                graphCenterNode={graphCenterNode}
                selectedNodeId={selectedNodeId}
                onNodeSelect={handleNodeSelect}
                onNodeSelection={handleNodeSelection}
                onCreateRelationship={handleCreateRelationship}
                onCreateNoteEntity={handleCreateNoteEntity}
                onRelationshipDelete={handleRelationshipDelete}
                onNoteEntityDelete={handleNoteEntityDelete}
                onPanelStateChange={setGraphPanelState}
              />
            </ReactFlowProvider>
          </TabsContent>
          <TabsContent value="entities" className="h-full flex-grow overflow-auto">
            <EntitiesPage />
          </TabsContent>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes">Notatki</TabsTrigger>
            <TabsTrigger value="graph">Graf</TabsTrigger>
            <TabsTrigger value="entities">Encje</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onCtaClick={handleCtaClick}
      />
    </>
  );
}
