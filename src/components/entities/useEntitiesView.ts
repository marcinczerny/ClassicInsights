import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createEntityRequest,
  deleteEntityRequest,
  fetchEntities,
  updateEntityRequest,
} from "@/lib/services/entities.api";
import type {
  EntitiesFilterState,
  EntitiesSortState,
  EntitiesViewController,
  PaginationState,
} from "@/components/entities/types.ts";
import type { CreateEntityCommand, EntityWithCountDTO, UpdateEntityCommand } from "@/types";

const DEFAULT_PAGE_LIMIT = 20;

const INITIAL_FILTERS: EntitiesFilterState = {
  search: "",
  type: "all",
};

const INITIAL_SORTING: EntitiesSortState = {
  column: "name",
  order: "asc",
};

function normalizeError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(fallbackMessage);
}

export function useEntitiesView(): EntitiesViewController {
  const [entities, setEntities] = useState<EntityWithCountDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageLimit, setPageLimit] = useState<number>(DEFAULT_PAGE_LIMIT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<EntitiesFilterState>(INITIAL_FILTERS);
  const [sorting, setSorting] = useState<EntitiesSortState>(INITIAL_SORTING);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [entityToEdit, setEntityToEdit] = useState<EntityWithCountDTO | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<EntityWithCountDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  const runFetch = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchEntities(
        {
          page,
          limit: pageLimit,
          search: filters.search.trim() ? filters.search.trim() : undefined,
          type: filters.type !== "all" ? filters.type : undefined,
          sort: sorting.column,
          order: sorting.order,
        },
        controller.signal,
      );

      if (requestIdRef.current !== requestId) {
        return;
      }

      setEntities(response.data);
      setPagination(response.pagination);
      setPageLimit(response.pagination.limit);
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      if (requestIdRef.current !== requestId) {
        return;
      }
      const normalized = normalizeError(err, "Nie udało się pobrać listy bytów.");
      setError(normalized);
    } finally {
      if (requestIdRef.current === requestId && !controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [page, pageLimit, filters.search, filters.type, sorting.column, sorting.order]);

  useEffect(() => {
    runFetch();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [runFetch]);

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
    }));
    setPage(1);
    setPagination((prev) => (prev ? { ...prev, page: 1 } : prev));
  }, []);

  const setTypeFilter = useCallback(
    (value: EntitiesFilterState["type"]) => {
      setFilters((prev) => ({
        ...prev,
        type: value,
      }));
      setPage(1);
      setPagination((prev) => (prev ? { ...prev, page: 1 } : prev));
    },
    [],
  );

  const setSortingHandler = useCallback(
    (column: EntitiesSortState["column"]) => {
      setSorting((prev) => {
        if (prev.column === column) {
          return {
            column,
            order: prev.order === "asc" ? "desc" : "asc",
          };
        }

        return {
          column,
          order: "asc",
        };
      });
      setPage(1);
      setPagination((prev) => (prev ? { ...prev, page: 1 } : prev));
    },
    [],
  );

  const setPageHandler = useCallback((nextPage: number) => {
    setPage(nextPage);
    setPagination((prev) => (prev ? { ...prev, page: nextPage } : prev));
  }, []);

  const openAddModal = useCallback(() => {
    setEntityToEdit(null);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((entity: EntityWithCountDTO) => {
    setEntityToEdit(entity);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEntityToEdit(null);
  }, []);

  const openDeleteModal = useCallback((entity: EntityWithCountDTO) => {
    setEntityToDelete(entity);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setEntityToDelete(null);
  }, []);

  const submitForm = useCallback(
    async (data: CreateEntityCommand | UpdateEntityCommand) => {
      const isEditing = Boolean(entityToEdit);
      setIsSubmitting(true);
      try {
        if (isEditing && entityToEdit) {
          await updateEntityRequest(entityToEdit.id, data as UpdateEntityCommand);
          toast.success(`Byt "${entityToEdit.name}" został zaktualizowany.`);
        } else {
          await createEntityRequest(data as CreateEntityCommand);
          toast.success("Nowy byt został utworzony.");
        }

        closeFormModal();
        if (!isEditing && page !== 1) {
          setPage(1);
          setPagination((prev) => (prev ? { ...prev, page: 1 } : prev));
        } else {
          await runFetch();
        }
      } catch (err) {
        const message = normalizeError(err, "Nie udało się zapisać bytu.").message;
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [closeFormModal, entityToEdit, page, runFetch],
  );

  const confirmDelete = useCallback(async () => {
    if (!entityToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteEntityRequest(entityToDelete.id);
      const deletedEntityName = entityToDelete.name;
      toast.success(`Byt "${deletedEntityName}" został usunięty.`);
      closeDeleteModal();

      const shouldGoToPreviousPage =
        pagination !== null && pagination.page > 1 && entities.length <= 1;

      if (shouldGoToPreviousPage) {
        setPage((prevPage) => Math.max(1, prevPage - 1));
        setPagination((prev) =>
          prev
            ? {
                ...prev,
                page: Math.max(1, prev.page - 1),
              }
            : prev,
        );
      } else {
        await runFetch();
      }
    } catch (err) {
      const message = normalizeError(err, "Nie udało się usunąć bytu.").message;
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [closeDeleteModal, entityToDelete, entities.length, pagination, runFetch]);

  const retry = useCallback(async () => {
    await runFetch();
  }, [runFetch]);

  const controllerState = useMemo<EntitiesViewController>(() => ({
    entities,
    pagination,
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
    setSearch,
    setTypeFilter,
    setSorting: setSortingHandler,
    setPage: setPageHandler,
    openAddModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    submitForm,
    confirmDelete,
    retry,
  }), [
    entities,
    pagination,
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
    setSearch,
    setTypeFilter,
    setSortingHandler,
    setPageHandler,
    openAddModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    submitForm,
    confirmDelete,
    retry,
  ]);

  return controllerState;
}

