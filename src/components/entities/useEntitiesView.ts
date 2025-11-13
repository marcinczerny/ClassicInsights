import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createEntityRequest,
  deleteEntityRequest,
  fetchEntities,
  updateEntityRequest,
} from "@/lib/services/entities.api";
import type { EntitiesFilterState, EntitiesSortState, EntitiesViewController } from "@/components/entities/types.ts";
import type { CreateEntityCommand, EntityWithCountDTO, UpdateEntityCommand } from "@/types";
import type { Enums } from "@/db/database.types";

const INITIAL_FILTERS: EntitiesFilterState = { search: "", type: "all" };
const INITIAL_SORTING: EntitiesSortState = { column: "name", order: "asc" };

function normalizeError(error: unknown, fallbackMessage: string): Error {
  return error instanceof Error ? error : new Error(fallbackMessage);
}

// Client-side filtering and sorting logic
const applyFiltersAndSorting = (
  entities: EntityWithCountDTO[],
  filters: EntitiesFilterState,
  sorting: EntitiesSortState
): EntityWithCountDTO[] => {
  let result = [...entities];

  // Filtering
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    result = result.filter((e) => e.name.toLowerCase().includes(searchTerm));
  }
  if (filters.type !== "all") {
    result = result.filter((e) => e.type === filters.type);
  }

  // Sorting
  result.sort((a, b) => {
    const aValue = a[sorting.column];
    const bValue = b[sorting.column];

    let comparison = 0;
    if (aValue > bValue) comparison = 1;
    else if (aValue < bValue) comparison = -1;

    return sorting.order === "asc" ? comparison : -comparison;
  });

  return result;
};

export function useEntitiesView(): EntitiesViewController {
  const [allEntities, setAllEntities] = useState<EntityWithCountDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<EntitiesFilterState>(INITIAL_FILTERS);
  const [sorting, setSorting] = useState<EntitiesSortState>(INITIAL_SORTING);

  // Modals and form state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [entityToEdit, setEntityToEdit] = useState<EntityWithCountDTO | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<EntityWithCountDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const runFetch = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchEntities({}, controller.signal);
      setAllEntities(response);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(normalizeError(err, "Nie udało się pobrać listy bytów."));
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    runFetch();
    return () => abortControllerRef.current?.abort();
  }, [runFetch]);

  const displayedEntities = useMemo(
    () => applyFiltersAndSorting(allEntities, filters, sorting),
    [allEntities, filters, sorting]
  );

  const setSortingHandler = useCallback((column: EntitiesSortState["column"]) => {
    setSorting((prev) => ({
      column,
      order: prev.column === column && prev.order === "asc" ? "desc" : "asc",
    }));
  }, []);

  const openAddModal = useCallback(() => {
    setEntityToEdit(null);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((entity: EntityWithCountDTO) => {
    setEntityToEdit(entity);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => setIsFormModalOpen(false), []);

  const openDeleteModal = useCallback((entity: EntityWithCountDTO) => {
    setEntityToDelete(entity);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => setIsDeleteModalOpen(false), []);

  const submitForm = useCallback(
    async (data: CreateEntityCommand | UpdateEntityCommand) => {
      setIsSubmitting(true);
      try {
        if (entityToEdit) {
          await updateEntityRequest(entityToEdit.id, data as UpdateEntityCommand);
          toast.success(`Byt "${entityToEdit.name}" został zaktualizowany.`);
        } else {
          await createEntityRequest(data as CreateEntityCommand);
          toast.success("Nowy byt został utworzony.");
        }
        closeFormModal();
        await runFetch(); // Refetch all data
      } catch (err) {
        toast.error(normalizeError(err, "Nie udało się zapisać bytu.").message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [entityToEdit, runFetch, closeFormModal]
  );

  const confirmDelete = useCallback(async () => {
    if (!entityToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEntityRequest(entityToDelete.id);
      toast.success(`Byt "${entityToDelete.name}" został usunięty.`);
      closeDeleteModal();
      await runFetch(); // Refetch all data
    } catch (err) {
      toast.error(normalizeError(err, "Nie udało się usunąć bytu.").message);
    } finally {
      setIsDeleting(false);
    }
  }, [entityToDelete, runFetch, closeDeleteModal]);

  return useMemo(
    () => ({
      entities: displayedEntities,
      pagination: null, // Pagination is removed
      isLoading,
      error,
      filters,
      sorting,
      isFormModalOpen,
      isDeleteModalOpen,
      entityToEdit,
      entityToDelete,
      isSubmitting,
      isDeleting,
      setSearch: (search: string) => setFilters((f) => ({ ...f, search })),
      setTypeFilter: (type: Enums<"entity_type"> | "all") => setFilters((f) => ({ ...f, type })),
      setSorting: setSortingHandler,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setPage: (_page: number) => {
        // No-op, pagination removed
      },
      openAddModal,
      openEditModal,
      closeFormModal,
      openDeleteModal,
      closeDeleteModal,
      submitForm,
      confirmDelete,
      retry: runFetch,
    }),
    [
      displayedEntities,
      isLoading,
      error,
      filters,
      sorting,
      isFormModalOpen,
      isDeleteModalOpen,
      entityToEdit,
      entityToDelete,
      isSubmitting,
      isDeleting,
      setSortingHandler,
      openAddModal,
      openEditModal,
      closeFormModal,
      openDeleteModal,
      closeDeleteModal,
      submitForm,
      confirmDelete,
      runFetch,
    ]
  );
}
