# Implementation Guide: Note-Entity Relationships with Typed Relationships

## Overview

This document describes the implementation changes needed to support typed relationships between notes and entities. The `note_entities` table now includes a `type` column (relationship_type enum) and `created_at` column, allowing users to specify the nature of the relationship (e.g., "criticizes", "expands_on", "is_related_to").

## Database Changes

### `note_entities` Table Structure
```sql
CREATE TABLE note_entities (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  type relationship_type NOT NULL DEFAULT 'is_related_to',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (note_id, entity_id)
);

CREATE INDEX idx_note_entities_type ON note_entities(type);
```

### Available Relationship Types
- `criticizes`
- `is_student_of`
- `expands_on`
- `influenced_by`
- `is_example_of`
- `is_related_to` (default)

---

## Service Layer Changes

### File: `src/lib/services/notes.service.ts`

#### Key Service Functions to Implement/Update

1. **`getNotes(supabase, userId, params)`**
   - Update the query to join `note_entities` with `type` column
   - Query structure:
   ```typescript
   const { data, error } = await supabase
     .from('notes')
     .select(`
       *,
       note_entities(
         type,
         entities(id, name, type, description)
       )
     `)
     .eq('user_id', userId)
     // ... additional filters, sorting, pagination
   ```
   - Transform the response to include `relationship_type` in each entity within `NoteDTO`

2. **`createNote(supabase, userId, command: CreateNoteCommand)`**
   - Support both new `entities` array format and legacy `entity_ids` format
   - If `command.entities` is provided:
     - Validate each `relationship_type` (if provided) against the enum
     - Insert into `note_entities` with the specified `type` (default to 'is_related_to')
   - If `command.entity_ids` is provided (deprecated):
     - Insert into `note_entities` with default `type` = 'is_related_to'
   - Implementation logic:
   ```typescript
   // After creating note
   if (command.entities?.length) {
     const associations = command.entities.map(e => ({
       note_id: noteId,
       entity_id: e.entity_id,
       type: e.relationship_type || 'is_related_to'
     }));
     await supabase.from('note_entities').insert(associations);
   } else if (command.entity_ids?.length) {
     // Legacy support
     const associations = command.entity_ids.map(id => ({
       note_id: noteId,
       entity_id: id,
       type: 'is_related_to'
     }));
     await supabase.from('note_entities').insert(associations);
   }
   ```

3. **`getNoteById(supabase, userId, noteId)`**
   - Similar to `getNotes`, ensure the query includes relationship types
   - Return `NoteDTO` with entities containing `relationship_type`

4. **`updateNote(supabase, userId, noteId, command: UpdateNoteCommand)`**
   - Support both `entities` and `entity_ids` formats
   - If either is provided, replace all associations:
     1. Delete existing entries: `DELETE FROM note_entities WHERE note_id = ?`
     2. Insert new entries with relationship types
   - Use a transaction to ensure atomicity

5. **`addEntityToNote(supabase, userId, noteId, entityId, relationshipType?)`**
   - Updated signature to accept optional `relationshipType`
   - Insert with specified type or default to 'is_related_to'
   - Check for duplicate (note_id, entity_id) pair and return 409 if exists
   - Implementation:
   ```typescript
   const { data, error } = await supabase
     .from('note_entities')
     .insert({
       note_id: noteId,
       entity_id: entityId,
       type: relationshipType || 'is_related_to'
     })
     .select()
     .single();
   ```

6. **`removeEntityFromNote(supabase, userId, noteId, entityId)`**
   - No changes needed - delete by composite key
   - Ensure proper authorization (note belongs to user)

---

### File: `src/lib/services/entities.service.ts`

#### Key Service Functions to Implement/Update

1. **`getEntityById(supabase, userId, entityId)`**
   - Update query to include relationship types from `note_entities`
   - Query structure:
   ```typescript
   const { data, error } = await supabase
     .from('entities')
     .select(`
       *,
       note_entities(
         type,
         created_at,
         notes(id, title, created_at)
       )
     `)
     .eq('id', entityId)
     .eq('user_id', userId)
     .single();
   ```
   - Transform response to include relationship type for each note

---

## API Endpoint Changes

### Notes Endpoints

#### **POST /api/notes**
**File:** `src/pages/api/notes/index.ts`

**Request Body Schema (Zod):**
```typescript
const createNoteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(10000).optional(),
  // New format with relationship types
  entities: z.array(z.object({
    entity_id: z.string().uuid(),
    relationship_type: z.enum([
      'criticizes',
      'is_student_of',
      'expands_on',
      'influenced_by',
      'is_example_of',
      'is_related_to'
    ]).optional()
  })).optional(),
  // Legacy format (deprecated)
  entity_ids: z.array(z.string().uuid()).optional()
}).refine(
  data => !data.entities || !data.entity_ids,
  { message: "Cannot provide both 'entities' and 'entity_ids'" }
);
```

**Handler Implementation:**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    return new Response(JSON.stringify({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    }), { status: 401 });
  }

  const userId = session.data.session.user.id;

  try {
    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    const note = await createNote(supabase, userId, validatedData);

    return new Response(JSON.stringify(note), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.errors
        }
      }), { status: 400 });
    }
    // Handle other errors...
  }
};
```

#### **GET /api/notes**
**File:** `src/pages/api/notes/index.ts`

**Response Format:**
```typescript
{
  data: [
    {
      id: "uuid",
      title: "Note Title",
      content: "Note content",
      created_at: "2025-01-26T10:00:00Z",
      updated_at: "2025-01-26T10:00:00Z",
      entities: [
        {
          id: "entity-uuid",
          name: "Plato",
          type: "person",
          description: "Ancient Greek philosopher",
          relationship_type: "criticizes"  // NEW FIELD
        }
      ]
    }
  ],
  pagination: { ... }
}
```

**Handler Implementation:**
- No changes to query parameters
- Update response transformation to include `relationship_type` from `note_entities`

#### **GET /api/notes/[id]**
**File:** `src/pages/api/notes/[id].ts`

**Handler Implementation:**
```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    return new Response(JSON.stringify({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    }), { status: 401 });
  }

  const userId = session.data.session.user.id;
  const noteId = params.id!;

  // Validate UUID
  if (!z.string().uuid().safeParse(noteId).success) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid note ID' }
    }), { status: 400 });
  }

  try {
    const note = await getNoteById(supabase, userId, noteId);

    if (!note) {
      return new Response(JSON.stringify({
        error: { code: 'NOT_FOUND', message: 'Note not found' }
      }), { status: 404 });
    }

    return new Response(JSON.stringify(note), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Handle errors...
  }
};
```

#### **PATCH /api/notes/[id]**
**File:** `src/pages/api/notes/[id].ts`

**Request Body Schema:**
```typescript
const updateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(10000).optional(),
  entities: z.array(z.object({
    entity_id: z.string().uuid(),
    relationship_type: z.enum([
      'criticizes',
      'is_student_of',
      'expands_on',
      'influenced_by',
      'is_example_of',
      'is_related_to'
    ]).optional()
  })).optional(),
  entity_ids: z.array(z.string().uuid()).optional()
}).refine(
  data => !data.entities || !data.entity_ids,
  { message: "Cannot provide both 'entities' and 'entity_ids'" }
);
```

**Handler Implementation:**
```typescript
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const supabase = locals.supabase;
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    return new Response(JSON.stringify({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    }), { status: 401 });
  }

  const userId = session.data.session.user.id;
  const noteId = params.id!;

  if (!z.string().uuid().safeParse(noteId).success) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid note ID' }
    }), { status: 400 });
  }

  try {
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    const updatedNote = await updateNote(supabase, userId, noteId, validatedData);

    if (!updatedNote) {
      return new Response(JSON.stringify({
        error: { code: 'NOT_FOUND', message: 'Note not found' }
      }), { status: 404 });
    }

    return new Response(JSON.stringify(updatedNote), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Handle errors...
  }
};
```

#### **POST /api/notes/[id]/entities**
**File:** `src/pages/api/notes/[id]/entities.ts`

**Request Body Schema:**
```typescript
const addEntitySchema = z.object({
  entity_id: z.string().uuid(),
  relationship_type: z.enum([
    'criticizes',
    'is_student_of',
    'expands_on',
    'influenced_by',
    'is_example_of',
    'is_related_to'
  ]).optional()
});
```

**Response Format:**
```typescript
{
  note_id: "uuid",
  entity_id: "uuid",
  type: "criticizes",
  created_at: "2025-01-26T10:00:00Z"
}
```

**Handler Implementation:**
```typescript
export const POST: APIRoute = async ({ params, request, locals }) => {
  const supabase = locals.supabase;
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    return new Response(JSON.stringify({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    }), { status: 401 });
  }

  const userId = session.data.session.user.id;
  const noteId = params.id!;

  if (!z.string().uuid().safeParse(noteId).success) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid note ID' }
    }), { status: 400 });
  }

  try {
    const body = await request.json();
    const { entity_id, relationship_type } = addEntitySchema.parse(body);

    const association = await addEntityToNote(
      supabase,
      userId,
      noteId,
      entity_id,
      relationship_type
    );

    return new Response(JSON.stringify(association), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.errors
        }
      }), { status: 400 });
    }
    // Handle duplicate key error (409)
    // Handle not found errors (404)
  }
};
```

#### **DELETE /api/notes/[id]/entities/[entityId]**
**File:** `src/pages/api/notes/[id]/entities/[entityId].ts`

**Handler Implementation:**
```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    return new Response(JSON.stringify({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    }), { status: 401 });
  }

  const userId = session.data.session.user.id;
  const noteId = params.id!;
  const entityId = params.entityId!;

  if (!z.string().uuid().safeParse(noteId).success ||
      !z.string().uuid().safeParse(entityId).success) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid UUID' }
    }), { status: 400 });
  }

  try {
    await removeEntityFromNote(supabase, userId, noteId, entityId);

    return new Response(null, { status: 204 });
  } catch (error) {
    // Handle not found errors (404)
  }
};
```

---

### Entities Endpoints

#### **GET /api/entities/[id]**
**File:** `src/pages/api/entities/[id].ts`

**Response Format:**
```typescript
{
  id: "uuid",
  name: "Plato",
  type: "person",
  description: "Ancient Greek philosopher",
  created_at: "2025-01-26T10:00:00Z",
  updated_at: "2025-01-26T10:00:00Z",
  notes: [
    {
      id: "note-uuid",
      title: "Note Title",
      created_at: "2025-01-26T10:00:00Z",
      relationship_type: "criticizes"  // NEW FIELD
    }
  ]
}
```

**Handler Implementation:**
```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    return new Response(JSON.stringify({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    }), { status: 401 });
  }

  const userId = session.data.session.user.id;
  const entityId = params.id!;

  if (!z.string().uuid().safeParse(entityId).success) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid entity ID' }
    }), { status: 400 });
  }

  try {
    const entity = await getEntityById(supabase, userId, entityId);

    if (!entity) {
      return new Response(JSON.stringify({
        error: { code: 'NOT_FOUND', message: 'Entity not found' }
      }), { status: 404 });
    }

    return new Response(JSON.stringify(entity), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Handle errors...
  }
};
```

---

## Validation Utilities

### File: `src/lib/validation.ts`

Create centralized Zod schemas:

```typescript
import { z } from 'zod';

// Relationship type enum
export const relationshipTypeSchema = z.enum([
  'criticizes',
  'is_student_of',
  'expands_on',
  'influenced_by',
  'is_example_of',
  'is_related_to'
]);

// Entity reference with optional relationship type
export const entityReferenceSchema = z.object({
  entity_id: z.string().uuid(),
  relationship_type: relationshipTypeSchema.optional()
});

// Create note command
export const createNoteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(10000).optional(),
  entities: z.array(entityReferenceSchema).optional(),
  entity_ids: z.array(z.string().uuid()).optional()
}).refine(
  data => !data.entities || !data.entity_ids,
  { message: "Cannot provide both 'entities' and 'entity_ids'" }
);

// Update note command
export const updateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(10000).optional(),
  entities: z.array(entityReferenceSchema).optional(),
  entity_ids: z.array(z.string().uuid()).optional()
}).refine(
  data => !data.entities || !data.entity_ids,
  { message: "Cannot provide both 'entities' and 'entity_ids'" }
);

// Add entity to note command
export const addEntityToNoteSchema = z.object({
  entity_id: z.string().uuid(),
  relationship_type: relationshipTypeSchema.optional()
});

// UUID validation
export const uuidSchema = z.string().uuid();
```

---

## Error Handling

### Centralized Error Response Handler

**File:** `src/lib/errors.ts`

```typescript
import type { ErrorDTO } from '@/types';

export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): Response {
  const errorBody: ErrorDTO = {
    error: {
      code,
      message,
      ...(details && { details })
    }
  };

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function handleServiceError(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return createErrorResponse(
      'VALIDATION_ERROR',
      'Invalid input data',
      400,
      error.errors
    );
  }

  // Check for Supabase duplicate key error
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === '23505') {
      return createErrorResponse(
        'CONFLICT',
        'Resource already exists',
        409
      );
    }
  }

  console.error('Unexpected error:', error);
  return createErrorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    500
  );
}
```

---

## Testing Checklist

### Notes Endpoints

- [ ] **POST /api/notes** with `entities` array (new format)
- [ ] **POST /api/notes** with `entity_ids` array (legacy format)
- [ ] **POST /api/notes** with both formats (should fail validation)
- [ ] **POST /api/notes** with invalid `relationship_type`
- [ ] **GET /api/notes** returns entities with `relationship_type`
- [ ] **GET /api/notes/[id]** returns entities with `relationship_type`
- [ ] **PATCH /api/notes/[id]** with `entities` array
- [ ] **PATCH /api/notes/[id]** with `entity_ids` array (legacy)
- [ ] **POST /api/notes/[id]/entities** with `relationship_type`
- [ ] **POST /api/notes/[id]/entities** without `relationship_type` (defaults to 'is_related_to')
- [ ] **DELETE /api/notes/[id]/entities/[entityId]**

### Entities Endpoints

- [ ] **GET /api/entities/[id]** returns notes with `relationship_type`

### Data Integrity

- [ ] Verify `relationship_type` is stored correctly in `note_entities` table
- [ ] Verify default value 'is_related_to' is applied when not specified
- [ ] Verify `created_at` timestamp is automatically set
- [ ] Verify cascade delete works for `note_entities` when note or entity is deleted

---

## Migration Checklist

- [x] Create migration file: `20251026120200_add_type_to_note_entities.sql`
- [x] Run migration in Supabase
- [x] Regenerate `src/db/database.types.ts`
- [x] Update `src/types.ts` with new type definitions
- [ ] Implement service layer changes in `notes.service.ts`
- [ ] Implement service layer changes in `entities.service.ts`
- [ ] Implement API endpoint changes
- [ ] Create validation schemas in `src/lib/validation.ts`
- [ ] Create error handling utilities in `src/lib/errors.ts`
- [ ] Test all endpoints with new relationship type support
- [ ] Update `endpoints.http` test file with new examples
- [ ] Update API documentation

---

## Implementation Priority

1. **Phase 1: Service Layer** (Foundation)
   - Implement `notes.service.ts` functions
   - Implement `entities.service.ts` functions
   - Create validation schemas
   - Create error handling utilities

2. **Phase 2: API Endpoints** (Interface)
   - Update `POST /api/notes`
   - Update `GET /api/notes` and `GET /api/notes/[id]`
   - Update `PATCH /api/notes/[id]`
   - Update `POST /api/notes/[id]/entities`
   - Update `GET /api/entities/[id]`

3. **Phase 3: Testing** (Verification)
   - Test all endpoints with various scenarios
   - Verify backward compatibility with `entity_ids`
   - Test error cases and validation

4. **Phase 4: Documentation** (Communication)
   - Update API documentation
   - Update example requests in `endpoints.http`
