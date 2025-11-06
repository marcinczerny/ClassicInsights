import type {
  CreateEntityCommand,
  EntityWithCountDTO,
  PaginationDTO,
  UpdateEntityCommand,
} from "@/types";
import type { Enums } from "@/db/database.types";

export type EntityType = Enums<"entity_type"> | "other";

export type EntitiesSortColumn = "name" | "type" | "created_at";

export type SortOrder = "asc" | "desc";

export type EntitiesSortState = {
  column: EntitiesSortColumn;
  order: SortOrder;
};

export type EntitiesFilterState = {
  search: string;
  type: EntityType | "all";
};

export type PaginationState = PaginationDTO;

export type EntitiesViewState = {
  entities: EntityWithCountDTO[];
  pagination: PaginationState | null;
  isLoading: boolean;
  error: Error | null;
  filters: EntitiesFilterState;
  sorting: EntitiesSortState;
  isFormModalOpen: boolean;
  isDeleteModalOpen: boolean;
  entityToEdit: EntityWithCountDTO | null;
  entityToDelete: EntityWithCountDTO | null;
  isSubmitting: boolean;
  isDeleting: boolean;
};

export type EntitiesViewHandlers = {
  setSearch: (value: string) => void;
  setTypeFilter: (value: EntitiesFilterState["type"]) => void;
  setSorting: (column: EntitiesSortColumn) => void;
  setPage: (page: number) => void;
  openAddModal: () => void;
  openEditModal: (entity: EntityWithCountDTO) => void;
  closeFormModal: () => void;
  openDeleteModal: (entity: EntityWithCountDTO) => void;
  closeDeleteModal: () => void;
  submitForm: (data: CreateEntityCommand | UpdateEntityCommand) => Promise<void>;
  confirmDelete: () => Promise<void>;
  retry: () => Promise<void>;
};

export type EntitiesViewController = EntitiesViewState & EntitiesViewHandlers;

