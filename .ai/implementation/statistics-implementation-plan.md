# API Endpoint Implementation Plan: GET /api/statistics

## 1. Endpoint Overview

The GET /api/statistics endpoint provides comprehensive usage statistics for the authenticated user. It returns aggregated data about notes, entities, relationships between entities, and AI suggestions, with the ability to filter by time period.

**Main functionalities:**

- Note statistics (total count and created within the period)
- Entity statistics (total count broken down by types)
- Relationship statistics (total count broken down by types)
- AI suggestions statistics (numbers generated, accepted, rejected, and acceptance rates)

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

```
/api/statistics
```

### Parameters

#### Query Parameters (optional)

- **period** (string, default: "all")
  - Description: Time period for `created_this_period` statistics
  - Allowed values: `"all"`, `"week"`, `"month"`, `"year"`
  - Default value: `"all"`
  - Example: `/api/statistics?period=month`

### Request Body

None - GET endpoint does not accept body.

### Headers

- **Authentication**: Required (Supabase session managed by middleware)

## 3. Types Used

### DTOs (from src/types.ts)

```typescript
// Main response type - already defined
export type StatisticsDTO = {
  notes: {
    total: number;
    created_this_period: number;
  };
  entities: {
    total: number;
    by_type: Record<Enums<"entity_type">, number>;
  };
  relationships: {
    total: number;
    by_type: Record<Enums<"relationship_type">, number>;
  };
  ai_suggestions: {
    total_generated: number;
    total_accepted: number;
    total_rejected: number;
    acceptance_rate: number;
    by_type: Record<Enums<"suggestion_type">, SuggestionTypeStatsDTO>;
  };
};

// Helper type - already defined
export type SuggestionTypeStatsDTO = {
  generated: number;
  accepted: number;
  acceptance_rate: number;
};
```

### Validation Schemas (new - to be created)

**Location**: `src/lib/validation/statistics.validation.ts`

```typescript
import { z } from "zod";

export const GetStatisticsQuerySchema = z.object({
  period: z.enum(["all", "week", "month", "year"]).default("all").optional(),
});

export type GetStatisticsQuery = z.infer<typeof GetStatisticsQuerySchema>;
```

## 4. Response Details

### Success Response (200 OK)

```typescript
{
  notes: {
    total: 42,
    created_this_period: 5
  },
  entities: {
    total: 28,
    by_type: {
      person: 10,
      work: 8,
      idea: 6,
      epoch: 2,
      school: 1,
      system: 1,
      other: 0
    }
  },
  relationships: {
    total: 35,
    by_type: {
      criticizes: 5,
      is_student_of: 8,
      expands_on: 12,
      influenced_by: 6,
      is_example_of: 3,
      is_related_to: 1
    }
  },
  ai_suggestions: {
    total_generated: 150,
    total_accepted: 112,
    total_rejected: 38,
    acceptance_rate: 0.75,
    by_type: {
      quote: {
        generated: 60,
        accepted: 50,
        acceptance_rate: 0.83
      },
      summary: {
        generated: 40,
        accepted: 30,
        acceptance_rate: 0.75
      },
      new_entity: {
        generated: 30,
        accepted: 20,
        acceptance_rate: 0.67
      },
      existing_entity_link: {
        generated: 20,
        accepted: 12,
        acceptance_rate: 0.60
      }
    }
  }
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid period parameter",
    "details": {
      "field": "period",
      "received": "invalid_value",
      "expected": ["all", "week", "month", "year"]
    }
  }
}
```

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User not authenticated"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to retrieve statistics"
  }
}
```

## 5. Data Flow

### Step 1: Request Validation

1. Middleware verifies user authentication
2. Parse the `period` query parameter
3. Validate `period` using Zod schema

### Step 2: Date Range Calculation

For the `period` parameter, the service calculates the boundary date:

- `"all"` → no date filtering (all records)
- `"week"` → `NOW() - INTERVAL '7 days'`
- `"month"` → `NOW() - INTERVAL '30 days'`
- `"year"` → `NOW() - INTERVAL '365 days'`

### Step 3: Parallel Database Queries

The service executes the following queries (can be run in parallel):

#### Query 1: Note Statistics

```sql
-- Total notes
SELECT COUNT(*) as total
FROM notes
WHERE user_id = $1;

-- Notes created in period (if period != "all")
SELECT COUNT(*) as created_this_period
FROM notes
WHERE user_id = $1 AND created_at >= $2;
```

#### Query 2: Entity Statistics

```sql
SELECT type, COUNT(*) as count
FROM entities
WHERE user_id = $1
GROUP BY type;
```

#### Query 3: Relationship Statistics

```sql
SELECT type, COUNT(*) as count
FROM relationships
WHERE user_id = $1
GROUP BY type;
```

#### Query 4: AI Suggestions Statistics

```sql
-- Suggestions by types and statuses
SELECT
  type,
  status,
  COUNT(*) as count
FROM ai_suggestions
WHERE user_id = $1
GROUP BY type, status;
```

### Step 4: Data Aggregation

The service processes query results:

1. Combines note statistics results
2. Creates `by_type` object for entities (fills missing types with zero)
3. Creates `by_type` object for relationships (fills missing types with zero)
4. Calculates AI statistics:
   - Sums total_generated, total_accepted, total_rejected
   - Calculates overall acceptance_rate
   - For each suggestion type calculates generated, accepted, acceptance_rate

### Step 5: Response Construction

The service returns an object of type `StatisticsDTO`.

### Step 6: Response Return

The endpoint returns JSON with status code 200.

## 6. Security Considerations

### Authentication

- **Middleware**: User session verification through Astro middleware
- **Required**: User must be logged in (`context.locals.supabase.auth.getUser()`)
- **No session**: Return 401 Unauthorized

### Authorization

- **Row Level Security (RLS)**: All queries filtered by `user_id = auth.uid()`
- **Data isolation**: User sees only their own statistics
- **RLS policies**: Already configured in the database for tables: notes, entities, relationships, ai_suggestions

### Input Data Validation

- **Zod schema**: Validation of the `period` parameter
- **Sanitization**: Zod automatically rejects invalid values
- **Default values**: Period default set to "all"

### Attack Prevention

- **SQL Injection**: Use of parameterized Supabase queries
- **NoSQL Injection**: Not applicable (PostgreSQL)
- **Rate Limiting**: Recommended (implementation at middleware or infrastructure level)

## 7. Error Handling

### Error Scenarios

| Scenario                     | Code | Error Code       | Handling                                         |
| ---------------------------- | ---- | ---------------- | ------------------------------------------------ |
| Invalid period parameter     | 400  | VALIDATION_ERROR | Zod validation error, return validation details  |
| Missing authentication       | 401  | UNAUTHORIZED     | Check in endpoint, early return                  |
| Database query error         | 500  | INTERNAL_ERROR   | Try-catch in service, log error, general message |
| Statistics calculation error | 500  | INTERNAL_ERROR   | Try-catch in service, default values or error    |

### Error Handling Strategy

#### In the endpoint (src/pages/api/statistics.ts)

```typescript
// 1. Authentication check
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      },
    }),
    { status: 401 }
  );
}

// 2. Parameter validation
const validationResult = GetStatisticsQuerySchema.safeParse(queryParams);
if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: validationResult.error.issues,
      },
    }),
    { status: 400 }
  );
}

// 3. Service call in try-catch
try {
  const statistics = await statisticsService.getUserStatistics(user.id, validatedParams.period);
  return new Response(JSON.stringify(statistics), { status: 200 });
} catch (error) {
  console.error("Failed to retrieve statistics:", error);
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve statistics",
      },
    }),
    { status: 500 }
  );
}
```

#### In the service (src/lib/services/statistics.service.ts)

```typescript
// Database query error handling
// Error propagation to endpoint
// Logging detailed error information
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Multiple SQL queries**: 4-5 separate database queries
2. **Aggregations**: COUNT and GROUP BY on potentially large tables
3. **No caching**: Statistics calculated on every request

### Optimization Strategies

#### Phase 1: Basic Implementation

- Execute queries in parallel (Promise.all)
- Use indexes on user_id columns (already created)
- Indexes on created_at for period filtering

#### Phase 2: Query Optimization (if needed)

- **Single Query Approach**: Combine queries into one with UNION ALL and JSONb aggregation
- **Materialized Views**: For frequently queried statistics
- **Partial Indexes**: For commonly used period values

#### Phase 3: Caching (if needed)

- **In-memory cache**: Redis or similar for "all" statistics
- **TTL**: 5-15 minutes for cache
- **Invalidation**: After creating/deleting notes, entities, relationships, accepting suggestions

#### Phase 4: Monitoring

- **Query Performance**: Monitoring query execution times
- **Database Load**: Checking database load during peak usage
- **Response Times**: Target <500ms for 95th percentile

### Recommended Indexes

Most indexes already exist (from db-plan.md), but worth verifying:

```sql
-- For period filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_notes_user_created
ON notes(user_id, created_at DESC);

-- For entity grouping
CREATE INDEX IF NOT EXISTS idx_entities_user_type
ON entities(user_id, type);

-- For relationship grouping
CREATE INDEX IF NOT EXISTS idx_relationships_user_type
ON relationships(user_id, type);

-- For AI suggestions grouping
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_type_status
ON ai_suggestions(user_id, type, status);
```

## 9. Implementation Steps

### Step 1: Create validation schema

**File**: `src/lib/validation/statistics.validation.ts`

```typescript
import { z } from "zod";

export const GetStatisticsQuerySchema = z.object({
  period: z.enum(["all", "week", "month", "year"]).default("all").optional(),
});

export type GetStatisticsQuery = z.infer<typeof GetStatisticsQuerySchema>;
```

### Step 2: Create statistics service

**File**: `src/lib/services/statistics.service.ts`

**Implementation:**

1. Function `calculateDateBoundary(period)` - calculates boundary date
2. Function `getNotesStatistics(userId, dateBoundary)` - note statistics
3. Function `getEntitiesStatistics(userId)` - entity statistics
4. Function `getRelationshipsStatistics(userId)` - relationship statistics
5. Function `getAISuggestionsStatistics(userId)` - AI suggestions statistics
6. Main function `getUserStatistics(userId, period)` - orchestrates above

**Structure:**

```typescript
export class StatisticsService {
  constructor(private supabase: SupabaseClient) {}

  async getUserStatistics(userId: string, period: string): Promise<StatisticsDTO> {
    // Calculate date boundary
    const dateBoundary = this.calculateDateBoundary(period);

    // Execute queries in parallel
    const [notes, entities, relationships, aiSuggestions] = await Promise.all([
      this.getNotesStatistics(userId, dateBoundary),
      this.getEntitiesStatistics(userId),
      this.getRelationshipsStatistics(userId),
      this.getAISuggestionsStatistics(userId),
    ]);

    return {
      notes,
      entities,
      relationships,
      ai_suggestions: aiSuggestions,
    };
  }

  private calculateDateBoundary(period: string): Date | null {
    // Implementation
  }

  private async getNotesStatistics(userId: string, dateBoundary: Date | null) {
    // Implementation
  }

  private async getEntitiesStatistics(userId: string) {
    // Implementation
  }

  private async getRelationshipsStatistics(userId: string) {
    // Implementation
  }

  private async getAISuggestionsStatistics(userId: string) {
    // Implementation
  }
}
```

### Step 3: Create API endpoint

**File**: `src/pages/api/statistics.ts`

**Implementation:**

1. Export `prerender = false`
2. Implement GET handler
3. Verify user authentication
4. Parse and validate query parameters
5. Call statistics service
6. Handle errors
7. Return response

**Structure:**

```typescript
export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  // 1. Authentication verification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Parse query parameters
  const url = new URL(request.url);
  const queryParams = {
    period: url.searchParams.get("period") || "all",
  };

  // 3. Validation
  const validationResult = GetStatisticsQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: validationResult.error.issues,
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Call service
  try {
    const statisticsService = new StatisticsService(supabase);
    const statistics = await statisticsService.getUserStatistics(
      user.id,
      validationResult.data.period
    );

    return new Response(JSON.stringify(statistics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to retrieve statistics:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve statistics",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Step 4: Unit tests (optional but recommended)

**File**: `src/lib/services/statistics.service.test.ts`

**Tests:**

1. Test date range calculation for different period values
2. Test note statistics aggregation
3. Test entity statistics aggregation (check all types filled)
4. Test relationship statistics aggregation
5. Test acceptance_rate calculation for AI suggestions
6. Test handling of empty data

### Step 5: Integration tests in endpoints.http

**Location**: Add to existing `endpoints.http` file

**Test scenarios:**

1. GET statistics with period=all
2. GET statistics with period=week
3. GET statistics with period=month
4. GET statistics with period=year
5. GET statistics without period parameter (default)
6. GET statistics with invalid period (400 error)
7. GET statistics without authentication (401 error)

### Step 6: Performance verification

1. Run endpoint with test data
2. Check response time
3. Analyze explain plan for SQL queries
4. Verify index usage

### Step 7: Documentation

1. Update API documentation (if exists)
2. Add usage examples
3. Code documentation (JSDoc comments)

---

## Summary

The implementation plan includes:

- ✅ Validation schema with Zod
- ✅ Service layer for business logic
- ✅ API endpoint compliant with Astro conventions
- ✅ Comprehensive error handling
- ✅ Performance optimization (parallel queries)
- ✅ Security (RLS, validation, authentication)
- ✅ Tests in endpoints.http

Implementation should take about 3-4 hours for an experienced developer, with the most time required for the service layer (AI statistics with acceptance rate calculations).
