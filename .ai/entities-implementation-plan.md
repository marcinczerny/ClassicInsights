# API Endpoint Implementation Plan: Entities Management

This document outlines the implementation plan for the REST API endpoints responsible for managing entities.

## 1. Overview

The Entities Management endpoints provide a full CRUD (Create, Read, Update, Delete) interface for managing entities. Entities are tags or concepts (like 'person', 'work', 'idea') that users can associate with their notes. All operations are scoped to the currently authenticated user.

## 2. Service Layer: `entities.service.ts`

To encapsulate database logic and promote code reuse, a new service file will be created at `src/lib/services/entities.service.ts`. This service will handle all interactions with the Supabase `entities`, `notes`, and `note_entities` tables.

**Note on `note_entities` Table Structure:**
The `note_entities` junction table has been enhanced with the following columns:
- `note_id` (UUID, PRIMARY KEY part)
- `entity_id` (UUID, PRIMARY KEY part)
- `type` (relationship_type enum, NOT NULL, DEFAULT 'is_related_to') - defines the relationship type between note and entity
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - timestamp when the association was created

**Key Functions:**

- `getEntities(supabase: SupabaseClient, userId: string, options: GetEntitiesOptions)`: Fetches a list of entities with filtering, sorting, and searching. Calculates `note_count` for each entity.
- `createEntity(supabase: SupabaseClient, userId: string, data: CreateEntityCommand)`: Creates a new entity for the user.
- `getEntityById(supabase: SupabaseClient, userId: string, entityId: string)`: Fetches a single entity by its ID and joins its associated notes with relationship types from `note_entities`.
- `updateEntity(supabase: SupabaseClient, userId: string, entityId: string, data: UpdateEntityCommand)`: Updates an existing entity.
- `deleteEntity(supabase: SupabaseClient, userId: string, entityId: string)`: Deletes an entity and its associations (cascade deletes from `note_entities` and `relationships`).

---

## 3. API Endpoints

### 3.1. List Entities

#### **Request Details**
- **Endpoint**: `GET /api/entities`
- **File**: `src/pages/api/entities/index.ts`
- **Method**: `GET`
- **Query Parameters**:
  - `search` (string, optional): Filter entities by name (case-insensitive search).
  - `type` (string, optional): Filter by `entity_type` enum.
  - `limit` (integer, optional, default: 50): Number of items per page.
  - `sort` (string, optional, default: "name"): Sort field (`name`, `created_at`, `type`, `note_count`).
  - `order` (string, optional, default: "asc"): Sort order (`asc`, `desc`).
- **Request Body**: None

#### **Response Details**
- **Success (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "name": "string",
        "type": "entity_type enum",
        "description": "string",
        "created_at": "ISO 8601 timestamp",
        "updated_at": "ISO 8601 timestamp",
        "note_count": 5
      }
    ]
  }
  ```
- **Used Types**: `EntitiesListResponseDTO`, `EntityWithCountDTO`.

#### **Data Flow & Logic**
1. Authenticate the user via `Astro.locals.session`.
2. Validate query parameters using a Zod schema, applying default values.
3. Call `entities.service.ts#getEntities` with the user ID and validated options.
4. The service function will construct a Supabase query:
   - Select from `entities`.
   - Use a remote procedure call (RPC) or a subquery to count associated notes (`note_count`).
   - Apply `ilike` for `search` filter.
   - Apply `.eq()` for `type` filter.
   - Apply `.order()` for sorting.
   - Apply `.range()` for pagination (`limit`).
5. The endpoint returns the result from the service, formatted as `EntitiesListResponseDTO`.

#### **Implementation Steps**
1. Create `src/lib/services/entities.service.ts` and implement the `getEntities` function.
2. Create `src/pages/api/entities/index.ts`.
3. Implement the `GET` handler function.
4. Add middleware for authentication, extracting `userId` from `Astro.locals.session`.
5. Define a Zod schema for query parameter validation.
6. Parse and validate `Astro.url.searchParams`.
7. Call the `getEntities` service function.
8. Return the response with a 200 status code.

### 3.2. Create Entity

#### **Request Details**
- **Endpoint**: `POST /api/entities`
- **File**: `src/pages/api/entities/index.ts`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "string",         // required, max 100
    "type": "string",         // required, entity_type enum
    "description": "string"   // optional, max 1000
  }
  ```

#### **Response Details**
- **Success (201 Created)**: Returns the newly created `EntityDTO` object.
- **Used Types**: `CreateEntityCommand`, `EntityDTO`.

#### **Data Flow & Logic**
1. Authenticate the user.
2. Validate the request body using a Zod schema for `CreateEntityCommand`.
3. Call `entities.service.ts#createEntity` with the user ID and validated body.
4. The service function will perform an `.insert()` into the `entities` table.
5. Supabase will check for `UNIQUE(user_id, name)` constraint violations.
6. The service returns the newly created entity data.
7. The endpoint returns the entity with a 201 status code.

#### **Implementation Steps**
1. Implement the `createEntity` function in `entities.service.ts`.
2. In `src/pages/api/entities/index.ts`, implement the `POST` handler.
3. Authenticate the user.
4. Define a Zod schema for the request body.
5. Parse and validate the request body from `Astro.request.json()`.
6. Call the `createEntity` service function within a `try...catch` block to handle potential unique constraint errors.
7. If successful, return the new entity with a 201 status.

### 3.3. Get Entity by ID

#### **Request Details**
- **Endpoint**: `GET /api/entities/[id]`
- **File**: `src/pages/api/entities/[id].ts`
- **Method**: `GET`
- **URL Parameters**: `id` (uuid, required).
- **Request Body**: None

#### **Response Details**
- **Success (200 OK)**:
  ```json
  {
    "id": "uuid",
    // ...entity fields
    "notes": [
      { "id": "uuid", "title": "string", "created_at": "timestamp" }
    ]
  }
  ```
- **Used Types**: `EntityWithNotesDTO`.

#### **Data Flow & Logic**
1. Authenticate the user.
2. Validate the `id` URL parameter is a valid UUID.
3. Call `entities.service.ts#getEntityById` with the user ID and entity ID.
4. The service function will query the `entities` table, filtering by `id` and `user_id` to enforce ownership. It will also join data from `note_entities` and `notes` to retrieve the list of associated notes with their relationship types.
5. If no entity is found, the service should return `null`.
6. The endpoint checks the service result. If `null`, it returns a 404. Otherwise, it returns the entity data.

#### **Implementation Steps**
1. Implement `getEntityById` in `entities.service.ts`. The Supabase query should look like: `supabase.from('entities').select('*, note_entities(type, notes(id, title, created_at))').eq('id', entityId).eq('user_id', userId).single()`.
   - Note: The `note_entities` table now includes `type` (relationship_type enum) and `created_at` columns.
   - The join through `note_entities` allows access to the relationship type between the entity and each note.
2. Create `src/pages/api/entities/[id].ts`.
3. Implement the `GET` handler.
4. Authenticate the user.
5. Validate the `Astro.params.id` as a UUID.
6. Call the `getEntityById` service function.
7. Handle the "not found" case by returning a 404 error.
8. Return the entity data with a 200 status.

### 3.4. Update Entity

#### **Request Details**
- **Endpoint**: `PATCH /api/entities/[id]`
- **File**: `src/pages/api/entities/[id].ts`
- **Method**: `PATCH`
- **URL Parameters**: `id` (uuid, required).
- **Request Body**:
  ```json
  {
    "name": "string",         // optional, max 100
    "type": "string",         // optional, entity_type enum
    "description": "string"   // optional, max 1000
  }
  ```

#### **Response Details**
- **Success (200 OK)**: Returns the updated `EntityDTO` object.
- **Used Types**: `UpdateEntityCommand`, `EntityDTO`.

#### **Data Flow & Logic**
1. Authenticate the user.
2. Validate the `id` URL parameter and the request body.
3. Call `entities.service.ts#updateEntity` with user ID, entity ID, and validated data.
4. The service function performs an `.update()` on the `entities` table, filtering by `id` and `user_id`. This atomically checks for ownership and performs the update.
5. The endpoint returns the updated entity data.

#### **Implementation Steps**
1. Implement `updateEntity` in `entities.service.ts`.
2. In `src/pages/api/entities/[id].ts`, implement the `PATCH` handler.
3. Authenticate the user.
4. Validate `Astro.params.id`.
5. Define a Zod schema for the partial request body and validate it.
6. Call the `updateEntity` service function.
7. Handle potential errors (e.g., not found, unique name violation).
8. Return the updated entity with a 200 status.

### 3.5. Delete Entity

#### **Request Details**
- **Endpoint**: `DELETE /api/entities/[id]`
- **File**: `src/pages/api/entities/[id].ts`
- **Method**: `DELETE`
- **URL Parameters**: `id` (uuid, required).
- **Request Body**: None

#### **Response Details**
- **Success (204 No Content)**: Empty response body.

#### **Data Flow & Logic**
1. Authenticate the user.
2. Validate the `id` URL parameter.
3. Call `entities.service.ts#deleteEntity` with user ID and entity ID.
4. The service function performs a `.delete()` on the `entities` table, filtering by `id` and `user_id`.
5. The database's `ON DELETE CASCADE` constraints will automatically remove associated records in `note_entities` and `relationships`.
6. The service function should check the `count` of deleted rows to confirm a record was actually deleted.
7. If count is 0, it means the entity was not found (or didn't belong to the user), so a 404 should be returned.

#### **Implementation Steps**
1. Implement `deleteEntity` in `entities.service.ts`.
2. In `src/pages/api/entities/[id].ts`, implement the `DELETE` handler.
3. Authenticate the user.
4. Validate `Astro.params.id`.
5. Call the `deleteEntity` service function.
6. Check the result to see if a row was deleted. If not, return 404.
7. If successful, return a 204 status.

## 4. Security
- **Authentication**: All endpoints must verify a valid session from `Astro.locals.session` and return 401 if missing.
- **Authorization**: All database queries within the service layer must be scoped with `.eq('user_id', userId)`. This leverages Supabase RLS for data isolation. Returning 404 for resources not found or not owned by the user is preferred to prevent ID enumeration attacks, though the spec suggests 403 in some cases which should be followed.
- **Input Validation**: Use Zod to strictly validate all incoming data (URL params, query params, and request bodies) to prevent invalid data from reaching the service layer.

## 5. Error Handling
- A centralized error handler or utility function should be used to create consistent JSON error responses (`ErrorDTO`).
- **400 Bad Request**: For Zod validation failures or business logic errors (e.g., duplicate name). The response should include details about the validation error.
- **401 Unauthorized**: When `Astro.locals.session` is null.
- **403 Forbidden**: As per the API spec, when a user attempts to access an entity belonging to another user.
- **404 Not Found**: When an entity with the specified ID does not exist for the authenticated user.
- **500 Internal Server Error**: For unexpected database errors or other server-side exceptions.
