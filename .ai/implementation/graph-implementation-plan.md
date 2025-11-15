# API Endpoint Implementation Plan: GET /api/graph

## 1. Endpoint Overview

The `GET /api/graph` endpoint returns a visualization graph of nodes (entities and notes) and edges (relationships and note-entity associations), focused around a specified central node. The graph can be expanded to 1-3 levels from the center, enabling visualization of connections between entities and notes.

**Main functionalities:**

- Return graph focused around entity or note
- Configurable graph depth (1-3 levels)
- Return both nodes (entities and notes) and edges (relationships and note-entity associations)
- Automatic determination of central node type

## 2. Request Details

- **HTTP Method:** GET
- **URL Structure:** `/api/graph`
- **Authentication:** Required (middleware checks `context.locals.user`)

### Query Parameters:

**Required:**

- `center_id` (string, format: UUID): ID of the central node (can be entity or note)
- `center_type` (string, enum: "entity" | "note"): Type of the central node

**Optional:**

- `levels` (number, integer, min: 1, max: 3, default: 2): Number of graph levels from center

**URL Examples:**

```
GET /api/graph?center_id=ea230e96-2789-4f25-b0ed-c815bb3b4326&center_type=entity
GET /api/graph?center_id=f6541be6-ef08-43bc-9d96-4ba20f6be97a&center_type=note&levels=3
```

## 3. Used Types

### Existing Types (src/types.ts):

**Response DTO:**

- `GraphDTO` - main response structure containing nodes and edges
- `GraphNodeDTO` - graph node (entity or note) with discriminated union
- `GraphEdgeDTO` - graph edge (relationship or note-entity association)

**Database types:**

- `Tables<"entities">` - entities table
- `Tables<"notes">` - notes table
- `Tables<"relationships">` - relationships table
- `Tables<"note_entities">` - note_entities table
- `Enums<"entity_type">` - enum of entity types
- `Enums<"relationship_type">` - enum of relationship types

### New Types to Create:

**Validation Schema (zod):**

```typescript
// In API endpoint file
const graphQuerySchema = z.object({
  center_id: z.string().uuid({ message: "center_id must be a valid UUID" }),
  center_type: z.enum(["entity", "note"], {
    errorMap: () => ({ message: "center_type must be either 'entity' or 'note'" }),
  }),
  levels: z.coerce
    .number()
    .int({ message: "levels must be an integer" })
    .min(1, { message: "levels must be at least 1" })
    .max(3, { message: "levels cannot exceed 3" })
    .default(2),
});

type GraphQueryParams = z.infer<typeof graphQuerySchema>;
```

## 4. Response Details

### Success Response (200 OK):

```typescript
{
  "nodes": [
    {
      "id": "uuid",
      "type": "entity",
      "name": "Plato",
      "entity_type": "person",
      "description": "Ancient Greek philosopher",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "type": "note",
      "name": "Critique of Plato's Theory of Forms",
      "note_preview": "This note explores the weaknesses in...",
      "created_at": "2024-01-16T14:20:00Z"
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "source_id": "note-uuid",
      "target_id": "entity-uuid",
      "type": "criticizes",
      "created_at": "2024-01-16T14:20:00Z"
    }
  ]
}
```

### Error Responses:

**400 Bad Request:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "center_id": ["center_id must be a valid UUID"]
    }
  }
}
```

**401 Unauthorized:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden:**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Center node does not belong to the authenticated user"
  }
}
```

**404 Not Found:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Center node not found"
  }
}
```

**500 Internal Server Error:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### Flow Diagram:

```
Client Request
     ↓
Astro Endpoint (GET /api/graph)
     ↓
Middleware (Auth Check) → 401 if no auth
     ↓
Query Parameters Validation (Zod) → 400 if invalid
     ↓
GraphService.getGraph(supabase, userId, params)
     ↓
┌─────────────────────────────────────┐
│ Graph Service Logic:                │
│ 1. Verify center node exists        │ → 404 if doesn't exist
│ 2. Verify node ownership            │ → 403 if doesn't belong to user
│ 3. Build graph recursively          │
│    - Level 0: center node           │
│    - Level 1-N: traverse neighbors  │
│ 4. Collect unique nodes & edges     │
│ 5. Transform to DTO format          │
└─────────────────────────────────────┘
     ↓
Return GraphDTO → 200 OK
```

### Graph Building Details:

**Traversal Algorithm (BFS - Breadth-First Search):**

```
1. Initialize:
   - nodesMap = new Map<string, GraphNodeDTO>()
   - edgesMap = new Map<string, GraphEdgeDTO>()
   - visitedNodes = new Set<string>()
   - currentLevel = [{ id: center_id, type: center_type }]

2. For each level (0 to levels):
   a. For each node in currentLevel:
      - If already visited, skip
      - Add to visitedNodes
      - Fetch node details from DB
      - Add to nodesMap

   b. Find neighbors:
      - If node is entity:
        * Find relationships where source_entity_id = node.id
        * Find relationships where target_entity_id = node.id
        * Find note_entities where entity_id = node.id
      - If node is note:
        * Find note_entities where note_id = node.id

   c. Add edges to edgesMap
   d. Add neighbor nodes to nextLevel
   e. currentLevel = nextLevel

3. Return { nodes: Array.from(nodesMap.values()), edges: Array.from(edgesMap.values()) }
```

## 6. Security Considerations

### Authentication and Authorization:

1. **Middleware Auth Check:**
   - Check `context.locals.user` (set by middleware)
   - If no user → 401 Unauthorized

2. **Center Node Ownership Verification:**
   - Before building graph, verify that center node belongs to `userId`
   - Query depends on `center_type`:
     - For entity: `SELECT user_id FROM entities WHERE id = center_id`
     - For note: `SELECT user_id FROM notes WHERE id = center_id`
   - If `user_id !== authenticated_user_id` → 403 Forbidden

3. **Row-Level Security (RLS):**
   - Supabase RLS is enabled on all tables
   - Automatically filters results to user data
   - Ensures we cannot accidentally return other users' data

### Input Validation:

1. **Zod Schema Validation:**
   - UUID format validation
   - Enum values validation
   - Numeric ranges validation (levels: 1-3)

2. **Sanitization:**
   - UUIDs are safe (controlled format)
   - Enum values are safe (limited list)
   - No user input in raw SQL queries (we use Supabase SDK)

### Protection Against Attacks:

1. **DoS Protection:**
   - Limiting `levels` to max 3 prevents excessive load
   - Potentially can add rate limiting at API level

2. **SQL Injection:**
   - We use Supabase SDK, not raw SQL
   - All parameters are typed and validated

## 7. Error Handling

### Error Mapping to HTTP Codes:

| Scenario                            | Code | Error Code       | Example Message                                       |
| ----------------------------------- | ---- | ---------------- | ----------------------------------------------------- |
| Missing center_id                   | 400  | VALIDATION_ERROR | center_id is required                                 |
| Missing center_type                 | 400  | VALIDATION_ERROR | center_type is required                               |
| Invalid UUID                        | 400  | VALIDATION_ERROR | center_id must be a valid UUID                        |
| Invalid center_type                 | 400  | VALIDATION_ERROR | center_type must be either 'entity' or 'note'         |
| levels < 1                          | 400  | VALIDATION_ERROR | levels must be at least 1                             |
| levels > 3                          | 400  | VALIDATION_ERROR | levels cannot exceed 3                                |
| No authentication                   | 401  | UNAUTHORIZED     | Authentication required                               |
| Center node belongs to another user | 403  | FORBIDDEN        | Center node does not belong to the authenticated user |
| Center node doesn't exist           | 404  | NOT_FOUND        | Center node not found                                 |
| Database error                      | 500  | INTERNAL_ERROR   | An unexpected error occurred                          |

### Error Handling in Code:

```typescript
// In endpoint
try {
  // Validation
  const params = graphQuerySchema.parse({
    center_id: url.searchParams.get("center_id"),
    center_type: url.searchParams.get("center_type"),
    levels: url.searchParams.get("levels"),
  });

  // Service call
  const graph = await graphService.getGraph(supabase, userId, params);

  return new Response(JSON.stringify(graph), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    return createValidationErrorResponse(error);
  }

  if (error instanceof NotFoundError) {
    return createNotFoundResponse(error.message);
  }

  if (error instanceof ForbiddenError) {
    return createForbiddenResponse(error.message);
  }

  console.error("Unexpected error in GET /api/graph:", error);
  return createInternalErrorResponse();
}
```

## 8. Performance Considerations

### Potential Bottlenecks:

1. **Recursive Queries:**
   - Multiple database queries in a loop
   - For levels=3 may generate many queries

2. **N+1 Problem:**
   - Fetching details for each node individually
   - Fetching edges for each node individually

### Optimization Strategies:

1. **Batch Queries:**
   - Instead of individual queries, use `.in()` for multiple IDs
   - Example: `SELECT * FROM entities WHERE id IN (id1, id2, id3)`

2. **Early Termination:**
   - Stop traversal when visitedNodes reaches reasonable limit (e.g. 100 nodes)
   - Prevents graph explosion

3. **Caching (optional, future):**
   - Cache frequently used graphs
   - Invalidate cache on update entities/notes/relationships

4. **Database Indexes:**
   - Ensure indexes exist on:
     - `relationships.source_entity_id`
     - `relationships.target_entity_id`
     - `note_entities.entity_id`
     - `note_entities.note_id`
   - These indexes are already defined in db-plan.md

5. **Limit Result Set:**
   - Consider maximum number of nodes limit (e.g. 200)
   - Return error if graph is too large

### Example Batch Query Optimization:

```typescript
// Instead of:
for (const nodeId of nodeIds) {
  const node = await supabase.from("entities").select().eq("id", nodeId).single();
  nodes.push(node);
}

// Use:
const { data: nodes } = await supabase.from("entities").select().in("id", nodeIds);
```

## 9. Implementation Steps

### Step 1: Prepare File Structure

**Location:** `src/lib/services/graph.service.ts`

Create new service file with basic structure:

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { GraphDTO, GraphNodeDTO, GraphEdgeDTO } from "../types";
import { NotFoundError, ForbiddenError } from "../errors/api-errors";

type GraphQueryParams = {
  center_id: string;
  center_type: "entity" | "note";
  levels: number;
};

export const graphService = {
  async getGraph(
    supabase: SupabaseClient,
    userId: string,
    params: GraphQueryParams
  ): Promise<GraphDTO> {
    // Implementation
  },
};
```

### Step 2: Implement Center Node Validation

In `graphService.getGraph()`:

```typescript
// 1. Verify center node exists and belongs to user
const centerNodeExists = await verifyCenterNode(
  supabase,
  userId,
  params.center_id,
  params.center_type
);

if (!centerNodeExists) {
  throw new NotFoundError("Center node not found");
}
```

Implementation of `verifyCenterNode`:

```typescript
async function verifyCenterNode(
  supabase: SupabaseClient,
  userId: string,
  centerId: string,
  centerType: "entity" | "note"
): Promise<boolean> {
  if (centerType === "entity") {
    const { data, error } = await supabase
      .from("entities")
      .select("id, user_id")
      .eq("id", centerId)
      .single();

    if (error || !data) return false;

    if (data.user_id !== userId) {
      throw new ForbiddenError("Center node does not belong to the authenticated user");
    }

    return true;
  } else {
    const { data, error } = await supabase
      .from("notes")
      .select("id, user_id")
      .eq("id", centerId)
      .single();

    if (error || !data) return false;

    if (data.user_id !== userId) {
      throw new ForbiddenError("Center node does not belong to the authenticated user");
    }

    return true;
  }
}
```

### Step 3: Implement Graph Building - Data Structures

```typescript
// Initialize data structures
const nodesMap = new Map<string, GraphNodeDTO>();
const edgesMap = new Map<string, GraphEdgeDTO>();
const visitedNodes = new Set<string>();

// Track nodes to visit at each level
let currentLevel: Array<{ id: string; type: "entity" | "note" }> = [
  { id: params.center_id, type: params.center_type },
];
```

### Step 4: Implement Main Traversal Loop

```typescript
for (let level = 0; level <= params.levels; level++) {
  const nextLevel: Array<{ id: string; type: "entity" | "note" }> = [];

  for (const node of currentLevel) {
    const nodeKey = `${node.type}:${node.id}`;

    // Skip if already visited
    if (visitedNodes.has(nodeKey)) continue;
    visitedNodes.add(nodeKey);

    // Fetch and add node details
    const nodeDTO = await fetchNodeDetails(supabase, node.id, node.type);
    if (nodeDTO) {
      nodesMap.set(nodeKey, nodeDTO);
    }

    // Find neighbors and edges
    if (level < params.levels) {
      const neighbors = await findNeighbors(supabase, node.id, node.type, edgesMap);
      nextLevel.push(...neighbors);
    }
  }

  currentLevel = nextLevel;
}
```

### Step 5: Implement Helper Functions - fetchNodeDetails

```typescript
async function fetchNodeDetails(
  supabase: SupabaseClient,
  nodeId: string,
  nodeType: "entity" | "note"
): Promise<GraphNodeDTO | null> {
  if (nodeType === "entity") {
    const { data, error } = await supabase
      .from("entities")
      .select("id, name, type, description, created_at")
      .eq("id", nodeId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      type: "entity",
      name: data.name,
      entity_type: data.type,
      description: data.description,
      created_at: data.created_at,
    };
  } else {
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, content, created_at")
      .eq("id", nodeId)
      .single();

    if (error || !data) return null;

    // Create note preview (first 100 chars of content)
    const notePreview = data.content
      ? data.content.substring(0, 100) + (data.content.length > 100 ? "..." : "")
      : undefined;

    return {
      id: data.id,
      type: "note",
      name: data.title,
      note_preview: notePreview,
      created_at: data.created_at,
    };
  }
}
```

### Step 6: Implement Helper Functions - findNeighbors

```typescript
async function findNeighbors(
  supabase: SupabaseClient,
  nodeId: string,
  nodeType: "entity" | "note",
  edgesMap: Map<string, GraphEdgeDTO>
): Promise<Array<{ id: string; type: "entity" | "note" }>> {
  const neighbors: Array<{ id: string; type: "entity" | "note" }> = [];

  if (nodeType === "entity") {
    // Find relationships where this entity is source
    const { data: outgoingRels } = await supabase
      .from("relationships")
      .select("id, source_entity_id, target_entity_id, type, created_at")
      .eq("source_entity_id", nodeId);

    if (outgoingRels) {
      for (const rel of outgoingRels) {
        const edgeKey = `relationship:${rel.id}`;
        edgesMap.set(edgeKey, {
          id: rel.id,
          source_id: rel.source_entity_id,
          target_id: rel.target_entity_id,
          type: rel.type,
          created_at: rel.created_at,
        });
        neighbors.push({ id: rel.target_entity_id, type: "entity" });
      }
    }

    // Find relationships where this entity is target
    const { data: incomingRels } = await supabase
      .from("relationships")
      .select("id, source_entity_id, target_entity_id, type, created_at")
      .eq("target_entity_id", nodeId);

    if (incomingRels) {
      for (const rel of incomingRels) {
        const edgeKey = `relationship:${rel.id}`;
        edgesMap.set(edgeKey, {
          id: rel.id,
          source_id: rel.source_entity_id,
          target_id: rel.target_entity_id,
          type: rel.type,
          created_at: rel.created_at,
        });
        neighbors.push({ id: rel.source_entity_id, type: "entity" });
      }
    }

    // Find notes connected to this entity
    const { data: noteAssocs } = await supabase
      .from("note_entities")
      .select("note_id, entity_id, type, created_at")
      .eq("entity_id", nodeId);

    if (noteAssocs) {
      for (const assoc of noteAssocs) {
        const edgeKey = `note-entity:${assoc.note_id}:${assoc.entity_id}`;
        edgesMap.set(edgeKey, {
          id: edgeKey, // note_entities doesn't have id, use composite key
          source_id: assoc.note_id,
          target_id: assoc.entity_id,
          type: assoc.type,
          created_at: assoc.created_at,
        });
        neighbors.push({ id: assoc.note_id, type: "note" });
      }
    }
  } else {
    // Node is a note - find entities connected to this note
    const { data: entityAssocs } = await supabase
      .from("note_entities")
      .select("note_id, entity_id, type, created_at")
      .eq("note_id", nodeId);

    if (entityAssocs) {
      for (const assoc of entityAssocs) {
        const edgeKey = `note-entity:${assoc.note_id}:${assoc.entity_id}`;
        edgesMap.set(edgeKey, {
          id: edgeKey,
          source_id: assoc.note_id,
          target_id: assoc.entity_id,
          type: assoc.type,
          created_at: assoc.created_at,
        });
        neighbors.push({ id: assoc.entity_id, type: "entity" });
      }
    }
  }

  return neighbors;
}
```

### Step 7: Return Result

```typescript
// Convert maps to arrays
return {
  nodes: Array.from(nodesMap.values()),
  edges: Array.from(edgesMap.values()),
};
```

### Step 8: Implement Astro Endpoint

**Location:** `src/pages/api/graph.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { graphService } from "../../lib/services/graph.service";
import {
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createInternalErrorResponse,
} from "../../lib/errors/error-responses";
import { NotFoundError, ForbiddenError } from "../../lib/errors/api-errors";

export const prerender = false;

const graphQuerySchema = z.object({
  center_id: z.string().uuid({ message: "center_id must be a valid UUID" }),
  center_type: z.enum(["entity", "note"], {
    errorMap: () => ({ message: "center_type must be either 'entity' or 'note'" }),
  }),
  levels: z.coerce
    .number()
    .int({ message: "levels must be an integer" })
    .min(1, { message: "levels must be at least 1" })
    .max(3, { message: "levels cannot exceed 3" })
    .default(2),
});

export const GET: APIRoute = async (context) => {
  const { url, locals } = context;
  const supabase = locals.supabase;
  const user = locals.user;

  // Check authentication
  if (!user) {
    return createUnauthorizedResponse();
  }

  try {
    // Validate query parameters
    const params = graphQuerySchema.parse({
      center_id: url.searchParams.get("center_id"),
      center_type: url.searchParams.get("center_type"),
      levels: url.searchParams.get("levels"),
    });

    // Get graph from service
    const graph = await graphService.getGraph(supabase, user.id, params);

    return new Response(JSON.stringify(graph), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error);
    }

    if (error instanceof NotFoundError) {
      return createNotFoundResponse(error.message);
    }

    if (error instanceof ForbiddenError) {
      return createForbiddenResponse(error.message);
    }

    console.error("Unexpected error in GET /api/graph:", error);
    return createInternalErrorResponse();
  }
};
```

### Step 9: Testing

Use `endpoints.http` to test all scenarios:

1. **Happy path** - entity as center, levels=2
2. **Happy path** - note as center, levels=1
3. **Edge case** - levels=3 (maximum depth)
4. **Error case** - missing center_id
5. **Error case** - invalid center_type
6. **Error case** - levels > 3
7. **Error case** - invalid UUID
8. **Error case** - center node doesn't exist (404)
9. **Error case** - center node belongs to another user (403) - requires test data

### Step 10: Optimization (Optional)

After basic implementation, consider optimizations:

1. **Batch queries** - instead of loops, use `.in()` for multiple IDs
2. **Early termination** - limit maximum number of nodes
3. **Performance monitoring** - log execution time for large graphs

### Step 11: Documentation

1. Update API documentation (if exists)
2. Add JSDoc comments to service functions
3. Update README with usage examples

## 10. Additional Notes

### Edge ID Structure for note_entities:

Since the `note_entities` table doesn't have an `id` column (it's a junction table with composite primary key), we use a composite key as the edge ID:

```typescript
const edgeKey = `note-entity:${note_id}:${entity_id}`;
```

### Note-entity Edge Direction:

Note-entity edges are represented as:

- `source_id`: note_id
- `target_id`: entity_id

This convention is consistent with the semantics of "note relates to entity".

### Performance Considerations for Large Graphs:

If a user has a very extensive graph (e.g. hundreds of entities and notes), the endpoint may be slow. Consider:

1. Maximum number of nodes limit (e.g. 200)
2. Pagination for very large graphs
3. Result caching
4. Server-side rendering of only the visible portion of the graph (viewport-based loading)

These optimizations can be implemented in the future based on real user needs.
