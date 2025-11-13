import type { JSX } from "react";
import { useEntitiesView } from "@/components/entities/useEntitiesView.ts";
import { EntitiesTableToolbar } from "@/components/entities/EntitiesTableToolbar.tsx";
import { EntitiesDataTable } from "@/components/entities/EntitiesDataTable.tsx";
import { EntityFormModal } from "@/components/entities/EntityFormModal.tsx";
import { DeleteConfirmationModal } from "@/components/entities/DeleteConfirmationModal.tsx";

export function EntitiesPage(): JSX.Element {
  const state = useEntitiesView();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zarządzanie bytami</h1>
          <p className="text-muted-foreground">
            Zarządzaj swoimi bytami - osobami, dziełami, epokami i innymi elementami wiedzy.
          </p>
        </div>

        {state.error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-destructive">
                <strong>Błąd:</strong> {state.error.message}
              </div>
              <button
                onClick={state.retry}
                className="text-sm text-destructive hover:underline"
                disabled={state.isLoading}
              >
                Spróbuj ponownie
              </button>
            </div>
          </div>
        )}

        <EntitiesTableToolbar
          filterType={state.filters.type}
          onSearchChange={state.setSearch}
          onFilterChange={state.setTypeFilter}
          onAddClick={state.openAddModal}
        />

        <EntitiesDataTable
          entities={state.entities}
          pagination={state.pagination}
          sorting={state.sorting}
          isLoading={state.isLoading}
          onSortChange={state.setSorting}
          onPageChange={state.setPage}
          onEdit={state.openEditModal}
          onDelete={state.openDeleteModal}
        />
      </div>

      <EntityFormModal
        isOpen={state.isFormModalOpen}
        entityToEdit={state.entityToEdit}
        isSubmitting={state.isSubmitting}
        onSubmit={state.submitForm}
        onClose={state.closeFormModal}
      />

      <DeleteConfirmationModal
        isOpen={state.isDeleteModalOpen}
        entity={state.entityToDelete}
        isDeleting={state.isDeleting}
        onConfirmDelete={state.confirmDelete}
        onCancel={state.closeDeleteModal}
      />
    </div>
  );
}
