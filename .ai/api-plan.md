# REST API Plan - ClassicInsight

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Profile | `profiles` | User profile information including AI consent |
| Note | `notes` | User-created notes about philosophical works and ideas |
| Entity | `entities` | Tags/entities that can be attached to notes (persons, works, epochs, ideas, etc.) |
| Relationship | `relationships` | Directed, typed connections between entities in the thought graph |
| Suggestion | `ai_suggestions` | AI-generated suggestions for notes (quotes, summaries, entity links) |
| Graph | Multiple tables | Computed view of the thought graph (nodes and edges) |
| Statistics | `ai_suggestions` | Usage metrics and analytics |

## 2. Endpoints

### 2.1 Authentication

Authentication is handled by Supabase Auth. The following operations are available through Supabase client SDK:
- Sign up with email/password
- Sign in with email/password
- Sign out
- Password reset

All API endpoints (except public health checks) require authentication via Supabase session cookie or JWT token.

---

### 2.2 Profile Management

#### GET /api/profile

Get the current user's profile.

**Authentication**: Required

**Query Parameters**: None

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "has_agreed_to_ai_data_processing": boolean,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 404 Not Found: Profile not found (should not happen if user exists)

---

#### PATCH /api/profile

Update the current user's profile.

**Authentication**: Required

**Query Parameters**: None

**Request Body**:
```json
{
  "has_agreed_to_ai_data_processing": boolean  // optional
}
```

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "has_agreed_to_ai_data_processing": boolean,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Error Responses**:
- 400 Bad Request: Invalid request body
- 401 Unauthorized: User not authenticated
- 404 Not Found: Profile not found

---

#### DELETE /api/profile

Delete the current user's account and all associated data (notes, entities, relationships).

**Authentication**: Required

**Query Parameters**: None

**Request Body**: None

**Success Response** (204 No Content): No body

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 500 Internal Server Error: Failed to delete account

---

### 2.3 Notes Management

#### GET /api/notes

Get a paginated list of notes for the current user.

**Authentication**: Required

**Query Parameters**:
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 20, max: 100): Number of items per page
- `sort` (string, optional, default: "created_at"): Sort field (created_at, updated_at, title)
- `order` (string, optional, default: "desc"): Sort order (asc, desc)
- `entities` (string, optional): Comma-separated list of entity IDs to filter by (returns notes that have ALL specified entities)
- `search` (string, optional): Search term to filter notes by title or content

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "string",
      "content": "string",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp",
      "entities": [
        {
          "id": "uuid",
          "name": "string",
          "type": "entity_type enum",
          "description": "string",
          "relationship_type": "relationship_type enum"  // Type of relationship between note and entity
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: User not authenticated

---

#### POST /api/notes

Create a new note.

**Authentication**: Required

**Query Parameters**: None

**Request Body**:
```json
{
  "title": "string",           // required, max 255 characters
  "content": "string",          // optional, max 10,000 characters
  "entities": [                 // optional, array of entities to attach with relationship types
    {
      "entity_id": "uuid",      // required
      "relationship_type": "relationship_type enum"  // optional, defaults to 'is_related_to'
    }
  ]
}
```

**Note**: For backward compatibility, `entity_ids` (array of UUIDs) is still supported but deprecated. When using `entity_ids`, all relationships will default to 'is_related_to'.

**Success Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "content": "string",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "entities": [
    {
      "id": "uuid",
      "name": "string",
      "type": "entity_type enum",
      "description": "string",
      "relationship_type": "relationship_type enum"
    }
  ]
}
```

**Error Responses**:
- 400 Bad Request: Invalid request body or validation error
  - Missing required fields
  - Title exceeds 255 characters
  - Content exceeds 10,000 characters
  - Invalid entity_ids or entities array (not found or not owned by user)
  - Invalid relationship_type value
- 401 Unauthorized: User not authenticated

---

#### GET /api/notes/:id

Get a single note by ID.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Note ID

**Query Parameters**: None

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "content": "string",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "entities": [
    {
      "id": "uuid",
      "name": "string",
      "type": "entity_type enum",
      "description": "string",
      "relationship_type": "relationship_type enum"
    }
  ]
}
```

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Note belongs to another user
- 404 Not Found: Note not found

---

#### PATCH /api/notes/:id

Update an existing note.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Note ID

**Query Parameters**: None

**Request Body**:
```json
{
  "title": "string",           // optional, max 255 characters
  "content": "string",          // optional, max 10,000 characters
  "entities": [                 // optional, replaces all existing entities with their relationship types
    {
      "entity_id": "uuid",      // required
      "relationship_type": "relationship_type enum"  // optional, defaults to 'is_related_to'
    }
  ]
}
```

**Note**: For backward compatibility, `entity_ids` (array of UUIDs) is still supported but deprecated. When using `entity_ids`, all relationships will default to 'is_related_to'.

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "content": "string",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "entities": [
    {
      "id": "uuid",
      "name": "string",
      "type": "entity_type enum",
      "description": "string",
      "relationship_type": "relationship_type enum"
    }
  ]
}
```

**Error Responses**:
- 400 Bad Request: Invalid request body or validation error
  - Invalid relationship_type value
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Note belongs to another user
- 404 Not Found: Note not found

---

#### DELETE /api/notes/:id

Delete a note.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Note ID

**Query Parameters**: None

**Request Body**: None

**Success Response** (204 No Content): No body

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Note belongs to another user
- 404 Not Found: Note not found

---

#### POST /api/notes/:id/entities

Add an entity to a note (alternative to updating note with entity_ids).

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Note ID

**Query Parameters**: None

**Request Body**:
```json
{
  "entity_id": "uuid",  // required
  "relationship_type": "relationship_type enum"  // optional, defaults to 'is_related_to'
}
```

**Success Response** (201 Created):
```json
{
  "note_id": "uuid",
  "entity_id": "uuid",
  "relationship_type": "relationship_type enum"
}
```

**Error Responses**:
- 400 Bad Request: Invalid entity_id, entity already attached, or invalid relationship_type
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Note or entity belongs to another user
- 404 Not Found: Note or entity not found

---

#### DELETE /api/notes/:id/entities/:entityId

Remove an entity from a note.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Note ID
- `entityId` (uuid, required): Entity ID

**Query Parameters**: None

**Request Body**: None

**Success Response** (204 No Content): No body

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Note or entity belongs to another user
- 404 Not Found: Note, entity, or association not found

---

### 2.4 Entities Management

#### GET /api/entities

Get a paginated list of entities for the current user.

**Authentication**: Required

**Query Parameters**:
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 50, max: 100): Number of items per page
- `search` (string, optional): Search term to filter entities by name (for autocomplete)
- `type` (string, optional): Filter by entity type (person, work, epoch, idea, school, system, other)
- `sort` (string, optional, default: "name"): Sort field (name, created_at, type)
- `order` (string, optional, default: "asc"): Sort order (asc, desc)

**Request Body**: None

**Success Response** (200 OK):
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
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "total_pages": 5
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: User not authenticated

---

#### POST /api/entities

Create a new entity.

**Authentication**: Required

**Query Parameters**: None

**Request Body**:
```json
{
  "name": "string",         // required, max 100 characters, must be unique per user
  "type": "string",         // required, one of: person, work, epoch, idea, school, system, other
  "description": "string"   // optional, max 1,000 characters
}
```

**Success Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "type": "entity_type enum",
  "description": "string",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Error Responses**:
- 400 Bad Request: Invalid request body or validation error
  - Missing required fields
  - Name exceeds 100 characters
  - Invalid type value
  - Description exceeds 1,000 characters
  - Name already exists for this user (UNIQUE constraint violation)
- 401 Unauthorized: User not authenticated

---

#### GET /api/entities/:id

Get a single entity by ID.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Entity ID

**Query Parameters**: None

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "type": "entity_type enum",
  "description": "string",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "notes": [
    {
      "id": "uuid",
      "title": "string",
      "created_at": "ISO 8601 timestamp"
    }
  ]
}
```

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Entity belongs to another user
- 404 Not Found: Entity not found

---

#### PATCH /api/entities/:id

Update an existing entity.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Entity ID

**Query Parameters**: None

**Request Body**:
```json
{
  "name": "string",         // optional, max 100 characters, must be unique per user
  "type": "string",         // optional, one of: person, work, epoch, idea, school, system, other
  "description": "string"   // optional, max 1,000 characters
}
```

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "type": "entity_type enum",
  "description": "string",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Error Responses**:
- 400 Bad Request: Invalid request body or validation error
  - Name exceeds 100 characters
  - Invalid type value
  - Description exceeds 1,000 characters
  - Name already exists for this user
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Entity belongs to another user
- 404 Not Found: Entity not found

---

#### DELETE /api/entities/:id

Delete an entity. This will also remove all note-entity associations and relationships involving this entity.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Entity ID

**Query Parameters**: None

**Request Body**: None

**Success Response** (204 No Content): No body

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Entity belongs to another user
- 404 Not Found: Entity not found

---

### 2.5 Relationships Management

#### GET /api/relationships

Get a list of relationships for the current user.

**Authentication**: Required

**Query Parameters**:
- `source_entity_id` (uuid, optional): Filter by source entity
- `target_entity_id` (uuid, optional): Filter by target entity
- `type` (string, optional): Filter by relationship type
- `limit` (integer, optional, default: 100, max: 500): Number of items to return

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "source_entity_id": "uuid",
      "target_entity_id": "uuid",
      "type": "relationship_type enum",
      "created_at": "ISO 8601 timestamp",
      "source_entity": {
        "id": "uuid",
        "name": "string",
        "type": "entity_type enum",
        "description": "string"
      },
      "target_entity": {
        "id": "uuid",
        "name": "string",
        "type": "entity_type enum",
        "description": "string"
      }
    }
  ]
}
```

**Error Responses**:
- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: User not authenticated

---

#### POST /api/relationships

Create a new relationship between two entities.

**Authentication**: Required

**Query Parameters**: None

**Request Body**:
```json
{
  "source_entity_id": "uuid",  // required
  "target_entity_id": "uuid",  // required
  "type": "string"             // required, one of: criticizes, is_student_of, expands_on, influenced_by, is_example_of, is_related_to
}
```

**Success Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "source_entity_id": "uuid",
  "target_entity_id": "uuid",
  "type": "relationship_type enum",
  "created_at": "ISO 8601 timestamp"
}
```

**Error Responses**:
- 400 Bad Request: Invalid request body or validation error
  - Missing required fields
  - Invalid type value
  - source_entity_id equals target_entity_id (self-reference)
  - Entities not found or not owned by user
  - Relationship already exists (UNIQUE constraint violation)
- 401 Unauthorized: User not authenticated

---

#### PATCH /api/relationships/:id

Update an existing relationship (mainly to change the type).

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Relationship ID

**Query Parameters**: None

**Request Body**:
```json
{
  "type": "string"  // required, one of: criticizes, is_student_of, expands_on, influenced_by, is_example_of, is_related_to
}
```

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "source_entity_id": "uuid",
  "target_entity_id": "uuid",
  "type": "relationship_type enum",
  "created_at": "ISO 8601 timestamp"
}
```

**Error Responses**:
- 400 Bad Request: Invalid type value or UNIQUE constraint violation
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Relationship belongs to another user
- 404 Not Found: Relationship not found

---

#### DELETE /api/relationships/:id

Delete a relationship.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Relationship ID

**Query Parameters**: None

**Request Body**: None

**Success Response** (204 No Content): No body

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Relationship belongs to another user
- 404 Not Found: Relationship not found

---

### 2.6 AI Suggestions

#### POST /api/notes/:id/analyze

Trigger AI analysis for a note. This endpoint initiates the AI processing and returns suggestions.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Note ID

**Query Parameters**: None

**Request Body**: None (note content is read from database)

**Success Response** (200 OK):
```json
{
  "note_id": "uuid",
  "suggestions": [
    {
      "id": "uuid",
      "type": "suggestion_type enum",  // quote, summary, new_entity, existing_entity_link
      "status": "pending",
      "name": "string",  // optional, used for entity name suggestions
      "content": "string",  // the actual suggestion content
      "suggested_entity_id": "uuid",  // optional, for existing_entity_link type
      "created_at": "ISO 8601 timestamp"
    }
  ],
  "generation_duration_ms": 1500
}
```

**Error Responses**:
- 400 Bad Request: User has not agreed to AI data processing
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Note belongs to another user
- 404 Not Found: Note not found
- 422 Unprocessable Entity: Note content is empty or too short for analysis
- 500 Internal Server Error: AI service error (error logged to ai_error_logs)
- 503 Service Unavailable: AI service temporarily unavailable

---

#### GET /api/notes/:id/suggestions

Get all suggestions for a note.

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Note ID

**Query Parameters**:
- `status` (string, optional): Filter by status (pending, accepted, rejected)

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "note_id": "uuid",
      "type": "suggestion_type enum",
      "status": "suggestion_status enum",
      "name": "string",
      "content": "string",
      "suggested_entity_id": "uuid",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ]
}
```

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Note belongs to another user
- 404 Not Found: Note not found

---

#### PATCH /api/suggestions/:id

Update a suggestion status (accept or reject).

**Authentication**: Required

**URL Parameters**:
- `id` (uuid, required): Suggestion ID

**Query Parameters**: None

**Request Body**:
```json
{
  "status": "string"  // required, one of: accepted, rejected
}
```

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "note_id": "uuid",
  "type": "suggestion_type enum",
  "status": "suggestion_status enum",
  "name": "string",
  "content": "string",
  "suggested_entity_id": "uuid",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Error Responses**:
- 400 Bad Request: Invalid status value or status transition not allowed
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Suggestion belongs to another user
- 404 Not Found: Suggestion not found

**Business Logic**: 
- When a suggestion of type `new_entity` is accepted, automatically create the entity
- When a suggestion of type `existing_entity_link` is accepted, automatically add the entity to the note
- When a suggestion of type `quote` or `summary` is accepted, it's simply marked as accepted for metrics

---

### 2.7 Thought Graph

#### GET /api/graph

Get a visualization-ready graph of entities and notes, centered on a specified entity or note.

**Authentication**: Required

**Query Parameters**:
- `center_id` (uuid, required): The ID of the center node (can be either an entity or a note). The node type is determined automatically.
- `center_type` ("entity" | "note", required): The type of the center node. Must be either `"entity"` or `"note"`.
- `levels` (integer, optional, default: 2, min: 1, max: 3): Number of steps away from the center to include in the graph.

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "nodes": [
    {
      "id": "uuid",
      "type": "entity" | "note",
      "name": "string",
      // For entity nodes only:
      "entity_type": "entity_type enum (e.g., person, work, idea, etc.)",
      "description": "string",
      // For note nodes only:
      "note_preview": "string (optional, e.g., truncated body or title)",
      "created_at": "ISO 8601 timestamp"
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "source_id": "uuid",   // node id (entity or note)
      "target_id": "uuid",   // node id (entity or note)
      "type": "relationship_type enum", // For both entity-entity and note-entity relationships
      "created_at": "ISO 8601 timestamp"
    }
  ]
}
```
> **Note:** Every graph always includes notes as nodes. Use the `type` field (`"entity"` vs. `"note"`) to distinguish nodes. The optional `entity_type` and `description` fields are only present for nodes where `type` is `"entity"`. For notes, the optional `note_preview` helps distinguish and preview content.

**Error Responses**:
- 400 Bad Request: Invalid parameters, missing `center_id` or `center_type`, or invalid values
- 401 Unauthorized: User not authenticated
- 403 Forbidden: Center node belongs to a different user
- 404 Not Found: Center node not found

**Business Logic**:
- The center of the graph may be either an entity or a note, determined by `center_type`.
- If an invalid or unsupported `center_type` is provided, return 400.
- Traverse the graph up to the specified number of `levels` from the center, including both relationships (entity-entity) and note-entity associations.
- Always include all relevant note nodes within the graph (even if no entity is specified as center).
- The structure of edges will reflect both entity-entity relationships and note-entity relationships, both using the same `relationship_type` enum for the `type` field.

---

### 2.8 Statistics

#### GET /api/statistics

Get usage statistics for the current user.

**Authentication**: Required

**Query Parameters**:
- `period` (string, optional, default: "all"): Time period (all, week, month, year)

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "notes": {
    "total": 42,
    "created_this_period": 5
  },
  "entities": {
    "total": 28,
    "by_type": {
      "person": 10,
      "work": 8,
      "idea": 6,
      "epoch": 2,
      "school": 1,
      "system": 1,
      "other": 0
    }
  },
  "relationships": {
    "total": 35,
    "by_type": {
      "criticizes": 5,
      "is_student_of": 8,
      "expands_on": 12,
      "influenced_by": 6,
      "is_example_of": 3,
      "is_related_to": 1
    }
  },
  "ai_suggestions": {
    "total_generated": 150,
    "total_accepted": 112,
    "total_rejected": 38,
    "acceptance_rate": 0.75,
    "by_type": {
      "quote": {
        "generated": 60,
        "accepted": 50,
        "acceptance_rate": 0.83
      },
      "summary": {
        "generated": 40,
        "accepted": 30,
        "acceptance_rate": 0.75
      },
      "new_entity": {
        "generated": 30,
        "accepted": 20,
        "acceptance_rate": 0.67
      },
      "existing_entity_link": {
        "generated": 20,
        "accepted": 12,
        "acceptance_rate": 0.60
      }
    }
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid period parameter
- 401 Unauthorized: User not authenticated

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Provider**: Supabase Auth

**Implementation**:
- Supabase handles user registration, login, logout, and password reset
- Authentication can be performed via:
  - Email/password
  - Magic links (email)
  - OAuth providers (future enhancement)

**Session Management**:
- Supabase issues JWT tokens on successful authentication
- Tokens are stored in HTTP-only cookies for web clients
- Tokens include user ID and metadata
- Token expiration: 1 hour (default), with automatic refresh

### 3.2 Authorization

**Mechanism**: Row Level Security (RLS) in PostgreSQL + Middleware checks

**Implementation**:

1. **Supabase RLS Policies**: 
   - Enabled on all user-facing tables (profiles, notes, entities, note_entities, relationships, ai_suggestions)
   - Policies ensure users can only access their own data using `auth.uid()` function
   - Defined in database schema (see db-plan.md section 5)

2. **Astro Middleware**:
   - Extract Supabase session from request context (`context.locals.supabase`)
   - Verify user is authenticated before processing API requests
   - Return 401 Unauthorized if no valid session

3. **API Endpoint Level**:
   - Each endpoint retrieves user ID from authenticated session
   - All database queries automatically filtered by RLS policies
   - Additional checks for cross-user access attempts

**Example Flow**:
```typescript
// In Astro API route
export async function GET({ locals }) {
  const { data: { user } } = await locals.supabase.auth.getUser();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }
  
  // RLS automatically filters results to current user
  const { data, error } = await locals.supabase
    .from('notes')
    .select('*');
    
  // ...
}
```

### 3.3 AI Data Processing Consent

Before processing any AI requests:
1. Check `profiles.has_agreed_to_ai_data_processing` flag
2. Return 400 Bad Request if consent not given
3. Prompt user to update profile with consent

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Profiles
- `has_agreed_to_ai_data_processing`: Boolean, required for AI features

#### Notes
- `title`: String, required, max 255 characters, non-empty after trim
- `content`: String, optional, max 10,000 characters
- `entity_ids`: Array of valid UUIDs, all entities must exist and belong to user

#### Entities
- `name`: String, required, max 100 characters, non-empty after trim
- Must be unique per user (case-insensitive recommended)
- `type`: Enum, required, one of: `person`, `work`, `epoch`, `idea`, `school`, `system`, `other`
- `description`: String, optional, max 1,000 characters

#### Relationships
- `source_entity_id`: UUID, required, must exist and belong to user
- `target_entity_id`: UUID, required, must exist and belong to user, must be different from source
- `type`: Enum, required, one of: `criticizes`, `is_student_of`, `expands_on`, `influenced_by`, `is_example_of`, `is_related_to`
- Combination of (user_id, source_entity_id, target_entity_id, type) must be unique

#### AI Suggestions
- `type`: Enum, required, one of: `quote`, `summary`, `new_entity`, `existing_entity_link`
- `status`: Enum, required, one of: `pending`, `accepted`, `rejected`
- `content`: String, max 1,000 characters
- `name`: String, max 255 characters (for entity name suggestions)
- Status transitions: `pending` → `accepted` or `rejected` (no other transitions allowed)

### 4.2 Business Logic Implementation

#### Note Management
- **Creating a note with entities**:
  1. Validate note fields
  2. Insert note record
  3. Validate all entity_ids (or entities array) exist and belong to user
  4. Validate relationship_type values if provided
  5. Insert note_entities associations with relationship types (defaults to 'is_related_to')
  6. Return note with attached entities including their relationship types

- **Updating a note with entities**:
  1. Validate note exists and belongs to user
  2. Update note fields
  3. If entities array (or entity_ids) provided: delete existing associations and create new ones with relationship types
  4. Return updated note with entities and their relationship types

- **Deleting a note**:
  1. Validate note exists and belongs to user
  2. Delete note (CASCADE deletes note_entities associations and ai_suggestions)
  3. Anonymize ai_suggestions (set note_id to NULL as per db design)

#### Entity Management
- **Creating an entity**:
  1. Validate name and type
  2. Check for duplicate name (case-insensitive)
  3. Insert entity
  4. Return created entity

- **Deleting an entity**:
  1. Validate entity exists and belongs to user
  2. Delete entity (CASCADE deletes note_entities and relationships)
  3. Update ai_suggestions to set suggested_entity_id to NULL

#### AI Suggestions
- **Analyzing a note**:
  1. Validate user has agreed to AI data processing
  2. Validate note exists and has content
  3. Fetch note with all associated entities
  4. Call AI service (OpenRouter) with note content and entity context
  5. Parse AI response and create suggestion records
  6. Log generation duration
  7. On error, log to ai_error_logs table and return error response
  8. Return suggestions

- **Accepting a suggestion**:
  1. Update suggestion status to 'accepted'
  2. If type is 'new_entity': create the entity
  3. If type is 'existing_entity_link': add entity to note
  4. Return updated suggestion

- **Rejecting a suggestion**:
  1. Update suggestion status to 'rejected'
  2. Return updated suggestion

#### Graph Generation
- **Computing graph data**:
  1. Identify center node (entity or note) based on `center_id` and `center_type`
  2. Use recursive query or graph traversal to find connected nodes up to specified `levels`
  3. Fetch all relationships between discovered entities
  4. Include all relevant note nodes and note-entity edges (notes are always included)
  5. Mark edge types appropriately: use `relationship_type` enum for entity-entity edges and `"note_entity"` for note-entity edges
  6. Return nodes and edges in format suitable for graph visualization library

#### Statistics
- **Computing statistics**:
  1. Count notes by time period
  2. Count entities by type
  3. Count relationships by type
  4. Aggregate ai_suggestions by type and status
  5. Calculate acceptance rates
  6. Return structured statistics

### 4.3 Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // optional, additional context
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: User not authenticated (401)
- `FORBIDDEN`: User not authorized to access resource (403)
- `NOT_FOUND`: Resource not found (404)
- `VALIDATION_ERROR`: Request validation failed (400)
- `DUPLICATE_ENTRY`: Unique constraint violation (400)
- `AI_CONSENT_REQUIRED`: User must agree to AI data processing (400)
- `AI_SERVICE_ERROR`: AI service returned an error (500)
- `INTERNAL_ERROR`: Unexpected server error (500)

### 4.4 Performance Considerations

- **Pagination**: All list endpoints support pagination to limit response size
- **Indexes**: Database indexes on foreign keys and frequently queried columns (see db-plan.md section 4)
- **Graph Traversal Limit**: Maximum levels of 3 to prevent performance issues when traversing the graph
- **AI Rate Limiting**: Consider implementing rate limiting on AI analysis endpoint to control costs
- **Caching**: Consider caching entity lists and statistics for frequently accessed data
- **Connection Pooling**: Use Supabase connection pooling for database queries

### 4.5 Data Anonymization

When user account or note is deleted:
- Related records in `ai_suggestions` and `ai_error_logs` have foreign keys set to NULL (ON DELETE SET NULL)
- This preserves anonymized data for analytics while respecting GDPR right to deletion
- Personal data (note content, entity names) is deleted via CASCADE

---

## 5. Additional Considerations

### 5.1 API Versioning

For MVP, no versioning is required. Future versions may use:
- URL versioning: `/api/v2/notes`
- Header versioning: `Accept: application/vnd.classicinsight.v2+json`

### 5.2 Rate Limiting

Recommended rate limits (to be implemented in future):
- Standard endpoints: 100 requests per minute per user
- AI analysis endpoint: 10 requests per minute per user
- Authentication endpoints: 5 requests per minute per IP

### 5.3 CORS

Configure CORS to allow requests only from:
- Production domain
- Development localhost
- Staging environment

### 5.4 Monitoring and Logging

Log the following for analytics and debugging:
- All API requests (timestamp, endpoint, user_id, response status, duration)
- All AI analysis requests (note_id, user_id, duration, success/failure)
- All errors (see ai_error_logs table)

### 5.5 Future Enhancements

Potential features not in MVP:
- Batch operations (create multiple notes/entities at once)
- Export API (export all user data as JSON/CSV)
- Webhooks for AI completion
- Real-time updates via WebSockets
- Public sharing of notes/graphs (with user consent)
- API for third-party integrations

---

## 6. Implementation Notes

### 6.1 Technology Stack

- **Framework**: Astro 5 with API routes in `src/pages/api/`
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **AI Service**: OpenRouter.ai API
- **Validation**: Zod schemas
- **Type Safety**: TypeScript with generated types from Supabase

### 6.2 File Structure

```
src/pages/api/
├── profile.ts              # GET, PATCH, DELETE /api/profile
├── notes/
│   ├── index.ts           # GET, POST /api/notes
│   ├── [id].ts            # GET, PATCH, DELETE /api/notes/:id
│   ├── [id]/
│   │   ├── entities.ts    # POST /api/notes/:id/entities
│   │   ├── [entityId].ts  # DELETE /api/notes/:id/entities/:entityId
│   │   ├── analyze.ts     # POST /api/notes/:id/analyze
│   │   └── suggestions.ts # GET /api/notes/:id/suggestions
├── entities/
│   ├── index.ts           # GET, POST /api/entities
│   └── [id].ts            # GET, PATCH, DELETE /api/entities/:id
├── relationships/
│   ├── index.ts           # GET, POST /api/relationships
│   └── [id].ts            # PATCH, DELETE /api/relationships/:id
├── suggestions/
│   └── [id].ts            # PATCH /api/suggestions/:id
├── graph.ts               # GET /api/graph
└── statistics.ts          # GET /api/statistics
```

### 6.3 Shared Utilities

Create reusable utilities in `src/lib/`:
- `validation.ts`: Zod schemas for request validation
- `errors.ts`: Error classes and error response helpers
- `ai-service.ts`: OpenRouter API client
- `graph-algorithms.ts`: Graph traversal logic

---

## 7. Testing Strategy

### 7.1 Unit Tests

Test individual components:
- Validation schemas
- Business logic functions
- Graph algorithms
- Error handlers

### 7.2 Integration Tests

Test API endpoints:
- All CRUD operations
- Authentication flows
- Authorization checks (RLS)
- AI analysis workflow
- Graph generation

### 7.3 E2E Tests

Test complete user workflows:
- User registration and login
- Creating note with entities
- Triggering AI analysis and accepting suggestions
- Building and visualizing thought graph
- Searching and filtering notes

---

This API plan provides a comprehensive foundation for building the ClassicInsight MVP. All endpoints are designed to be RESTful, secure, and aligned with the database schema and product requirements.

