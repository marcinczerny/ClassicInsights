# Implementation Plan for Entity Management View

## 1. Overview
The "Global Entity Management" view is a centralized place in the application that allows users to manage all the entities (tags) they have created. Users can browse, filter, search, create, edit, and delete entities, which helps maintain order in their personal knowledge base and facilitates the reuse of entities when creating notes.

## 2. View Routing
The view will be available at the following path:
- `/entities`

Implementation will be done by creating an Astro page file `src/pages/entities.astro`, which will render the main React component responsible for the view.

## 3. Component Structure
The React component hierarchy for this view will be as follows:

```
- EntitiesPage.tsx (Main view component)
  - EntitiesTableToolbar.tsx (Toolbar above the table)
    - Input (for searching)
    - Select (for filtering by type)
    - Button (for adding a new entity)
  - EntitiesDataTable.tsx (Data table)
    - Table (component from Shadcn/ui)
    - DropdownMenu (for row actions: edit, delete)
    - Pagination (component from Shadcn/ui)
  - EntityFormModal.tsx (Modal for creating/editing an entity)
    - Dialog (component from Shadcn/ui)
    - Form with fields: name, type, description
  - DeleteConfirmationModal.tsx (Modal for delete confirmation)
    - AlertDialog (component from Shadcn/ui)
```

## 4. Component Details

### `EntitiesPage.tsx`
- **Component Description:** The main container for the view. It is responsible for state management (data, filters, pagination, loading, errors), API communication, and coordinating the actions of child components.
- **Main Elements:** Renders `EntitiesTableToolbar`, `EntitiesDataTable`, and manages the visibility of the `EntityFormModal` and `DeleteConfirmationModal` modals.
- **Handled Interactions:** Reacts to events from child components (filter change, search, pagination) and initiates data refetching.
- **Validation Handled:** No validation at this level.
- **Types:** `EntitiesViewState`, `EntityDTO`.
- **Props:** None (the component is rendered directly by the Astro page).

### `EntitiesTableToolbar.tsx`
- **Component Description:** A toolbar located above the data table. It contains controls for interacting with the list of entities.
- **Main Elements:**
    - `Input` from Shadcn/ui for text search.
    - `Select` from Shadcn/ui for filtering entities by their type.
    - `Button` from Shadcn/ui for opening the new entity creation modal.
- **Handled Interactions:**
    - `onSearchChange(searchTerm: string)`: Called when the text in the search field changes.
    - `onFilterChange(type: EntityType | 'all')`: Called when the selected type in the filter changes.
    - `onAddClick()`: Called after clicking the "Add Entity" button.
- **Validation Handled:** None.
- **Types:** `EntityType`.
- **Props:**
    - `filters: EntitiesFilterState`
    - `onSearchChange: (value: string) => void`
    - `onFilterChange: (value: string) => void`
    - `onAddClick: () => void`

### `EntitiesDataTable.tsx`
- **Component Description:** Displays a list of entities in a table with sorting and pagination capabilities.
- **Main Elements:**
    - `Table` from Shadcn/ui to display data.
    - Column headers with sorting support.
    - Table rows, each with a context menu (`DropdownMenu`) for "Edit" and "Delete" actions.
    - `Pagination` from Shadcn/ui for navigating between pages.
- **Handled Interactions:**
    - `onSortChange(column: string)`: Called after clicking on a column header.
    - `onPageChange(page: number)`: Called when the page changes.
    - `onEdit(entity: EntityDTO)`: Called after selecting the "Edit" option.
    - `onDelete(entity: EntityDTO)`: Called after selecting the "Delete" option.
- **Validation Handled:** None.
- **Types:** `EntityDTO`, `PaginationDTO`, `EntitiesSortState`.
- **Props:**
    - `entities: EntityDTO[]`
    - `pagination: PaginationDTO | null`
    - `sorting: EntitiesSortState`
    - `isLoading: boolean`
    - `onSortChange: (column: keyof EntityDTO) => void`
    - `onPageChange: (page: number) => void`
    - `onEdit: (entity: EntityDTO) => void`
    - `onDelete: (entity: EntityDTO) => void`

### `EntityFormModal.tsx`
- **Component Description:** A modal with a form for creating a new entity or editing an existing one.
- **Main Elements:**
    - `Dialog` from Shadcn/ui as the modal container.
    - A form containing: `Input` for name, `Select` for type, `Textarea` for description.
    - "Save" and "Cancel" buttons.
- **Handled Interactions:**
    - `onSubmit(data: CreateEntityCommand | UpdateEntityCommand)`: Called after successful validation and form submission.
    - `onClose()`: Called when the modal is closed.
- **Validation Handled:**
    - `name`: Required, maximum 100 characters.
    - `type`: Required, must be one of the predefined types.
    - `description`: Optional, maximum 1000 characters.
- **Types:** `EntityDTO`, `CreateEntityCommand`, `UpdateEntityCommand`.
- **Props:**
    - `isOpen: boolean`
    - `entityToEdit: EntityDTO | null`
    - `onSubmit: (data) => void`
    - `onClose: () => void`

### `DeleteConfirmationModal.tsx`
- **Component Description:** A simple dialog modal to confirm the entity deletion operation.
- **Main Elements:** `AlertDialog` from Shadcn/ui, displaying the name of the entity to be deleted and "Confirm" and "Cancel" buttons.
- **Handled Interactions:** `onConfirmDelete()`, `onCancel()`.
- **Validation Handled:** None.
- **Types:** `EntityDTO`.
- **Props:**
    - `isOpen: boolean`
    - `entity: EntityDTO | null`
    - `onConfirmDelete: () => void`
    - `onCancel: () => void`

## 5. Types
The following data structures will be required to implement the view:

```typescript
// Entity and pagination types (API compliant)
export type EntityType = 'person' | 'work' | 'epoch' | 'idea' | 'school' | 'system' | 'other';

export interface EntityDTO {
  id: string;
  name: string;
  type: EntityType;
  description: string | null;
  created_at: string;
  note_count: number;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// CUD command types
export interface CreateEntityCommand {
    name: string;
    type: EntityType;
    description?: string;
}

export interface UpdateEntityCommand {
    name?: string;
    type?: EntityType;
    description?: string;
}

// Helper types for view state
export type SortOrder = 'asc' | 'desc';

export interface EntitiesSortState {
    column: 'name' | 'type' | 'created_at';
    order: SortOrder;
}

export interface EntitiesFilterState {
    search: string;
    type: EntityType | 'all';
}

// Main state type for the entire view
export interface EntitiesViewState {
    entities: EntityDTO[];
    pagination: PaginationDTO | null;
    isLoading: boolean;
    error: Error | null;
    filters: EntitiesFilterState;
    sorting: EntitiesSortState;
    isFormModalOpen: boolean;
    isDeleteModalOpen: boolean;
    entityToEdit: EntityDTO | null;
    entityToDelete: EntityDTO | null;
}
```

## 6. State Management
All logic and state for the view will be encapsulated in a custom `useEntitiesView` hook. This approach separates logic from presentation, keeping the `EntitiesPage` component clean.

**The `useEntitiesView` hook will manage:**
- **Data state:** `entities`, `pagination`, `isLoading`, `error`.
- **Filter and sort state:** `filters`, `sorting`.
- **User interface state:** `isFormModalOpen`, `isDeleteModalOpen`, `entityToEdit`, `entityToDelete`.

**Functions exposed by the hook:**
- Functions to modify filters, sorting, and pagination.
- Functions to open/close modals (`openAddModal`, `openEditModal`, `openDeleteModal`).
- Functions to handle CUD operations (`handleFormSubmit`, `handleConfirmDelete`), which will call the appropriate API services.

The hook will use `useEffect` to automatically fetch data from the API whenever dependencies like filters, sorting, or the page number change.

## 7. API Integration
API integration will be based on the `/api/entities` endpoint.

- **`GET /api/entities`**:
  - **Purpose:** Fetching the list of entities.
  - **Request:** The call will include query parameters (`page`, `limit`, `search`, `type`, `sort`, `order`) based on the current view state.
  - **Response:** An object `{ data: EntityDTO[], pagination: PaginationDTO }` is expected.
- **`POST /api/entities`**:
  - **Purpose:** Creating a new entity.
  - **Request:** The request body will be of type `CreateEntityCommand`.
  - **Response:** Returns the newly created `EntityDTO` object.
- **`PATCH /api/entities/:id`**:
  - **Purpose:** Updating an existing entity.
  - **Request:** The request body will be of type `UpdateEntityCommand`.
  - **Response:** Returns the updated `EntityDTO` object.
- **`DELETE /api/entities/:id`**:
  - **Purpose:** Deleting an entity.
  - **Request:** A call without a request body, with the entity ID in the URL.
  - **Response:** Status `204 No Content`.

All data-modifying operations (POST, PATCH, DELETE) should result in refetching the entity list to refresh the view.

## 8. User Interactions
- **Searching:** Typing text into the search field causes the list to refresh (with a debounce) to reflect the `search` filter.
- **Filtering:** Selecting a type from the dropdown immediately refreshes the list with the `type` filter.
- **Sorting:** Clicking a column header changes the sorting criteria (`sort`, `order`) and refreshes the list.
- **Pagination:** Clicking pagination buttons changes the `page` parameter and fetches the new page of data.
- **Creating an entity:** Clicking "Add Entity" opens the `EntityFormModal`. Filling out and submitting the form sends a `POST` request and then refreshes the table.
- **Editing an entity:** Selecting "Edit" opens the `EntityFormModal` with pre-filled data. Submitting the form sends a `PATCH` request and refreshes the table.
- **Deleting an entity:** Selecting "Delete" opens the `DeleteConfirmationModal`. Confirming sends a `DELETE` request and refreshes the table.

## 9. Conditions and Validation
Input validation will be handled at the `EntityFormModal` component level before sending a request to the API.
- **`name` field:**
  - Verify that it is not empty.
  - Verify that the length does not exceed 100 characters.
  - An error message is displayed below the form field.
- **`type` field:**
  - Verify that a value has been selected (handled by `Select` with a default value).
- **`description` field:**
  - Verify that the length does not exceed 1000 characters.

The "Save" button in the form will be disabled until all required fields are correctly filled.

## 10. Error Handling
- **Data Fetching Error (GET):** In case of a network or server error, an error message with a "Try Again" button will be displayed instead of the table.
- **Server-side Validation Error (400):** Error messages returned by the API will be displayed next to the corresponding fields in `EntityFormModal`.
- **Name Conflict (409):** If an entity with the given name already exists, a dedicated error message ("Entity with this name already exists") will appear in `EntityFormModal`.
- **Other Errors (e.g., 500):** For CUD operations, a generic error message will be displayed using a `Toast` component (e.g., from `sonner`), informing the user that the operation failed.

## 11. Implementation Steps
1. **File Structure:** Create the `src/pages/entities.astro` file and the `src/components/entities` directory with files for all components (`EntitiesPage.tsx`, `EntitiesDataTable.tsx`, etc.) and types (`types.ts`).
2. **Type Definitions:** Implement all required types in the `src/components/entities/types.ts` file.
3. **API Services Implementation:** Create client functions (e.g., in `src/lib/services/entities.service.ts`) to communicate with the `/api/entities` endpoint for GET, POST, PATCH, DELETE operations.
4. **Create `useEntitiesView` Hook:** Implement all state management logic, including data fetching and mutations.
5. **Implement UI Components (Bottom-up):**
   - Start with atomic components: `EntityFormModal` and `DeleteConfirmationModal`.
   - Implement composite components: `EntitiesTableToolbar` and `EntitiesDataTable`.
   - Assemble everything in the main `EntitiesPage.tsx` component.
6. **Create Astro Page:** Create `src/pages/entities.astro` and embed the `EntitiesPage` component with the `client:load` attribute.
7. **Routing:** Add a link to the new page in the application navigation (e.g., in `NavLinks.tsx`).
8. **Testing and Refinements:** Manually test all user interactions, error handling, and edge cases.
