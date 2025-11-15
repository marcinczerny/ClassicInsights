import { http, HttpResponse } from "msw";

// Mock data for testing
const mockNotes = [
  {
    id: "note-1",
    title: "Test Note 1",
    content: "This is a test note content",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    user_id: "user-1",
  },
];

const mockEntities = [
  {
    id: "entity-1",
    name: "Test Entity",
    description: "A test entity",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    user_id: "user-1",
  },
];

// MSW handlers for API endpoints
export const handlers = [
  // Auth endpoints
  http.post("/api/auth/login", () => {
    return HttpResponse.json({
      user: { id: "user-1", email: "test@example.com" },
      session: { access_token: "mock-token", refresh_token: "mock-refresh-token" },
    });
  }),

  http.post("/api/auth/register", () => {
    return HttpResponse.json({
      user: { id: "user-1", email: "test@example.com" },
      session: { access_token: "mock-token", refresh_token: "mock-refresh-token" },
    });
  }),

  http.post("/api/auth/logout", () => {
    return HttpResponse.json({ success: true });
  }),

  // Notes endpoints
  http.get("/api/notes", () => {
    return HttpResponse.json(mockNotes);
  }),

  http.post("/api/notes", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newNote = {
      id: "note-new",
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user-1",
    };
    return HttpResponse.json(newNote);
  }),

  http.get("/api/notes/:id", ({ params }) => {
    const note = mockNotes.find((n) => n.id === params.id);
    if (note) {
      return HttpResponse.json(note);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.put("/api/notes/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const updatedNote = {
      id: params.id,
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(updatedNote);
  }),

  http.delete("/api/notes/:id", () => {
    return HttpResponse.json({ success: true });
  }),

  // Entities endpoints
  http.get("/api/entities", ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    if (search) {
      // Return search results wrapped in data
      const filteredEntities = mockEntities.filter(entity =>
        entity.name.toLowerCase().includes(search.toLowerCase())
      );
      return HttpResponse.json({ data: filteredEntities });
    } else {
      // Return all entities wrapped in data
      return HttpResponse.json({ data: mockEntities });
    }
  }),

  http.post("/api/entities", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newEntity = {
      id: "entity-new",
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user-1",
    };
    return HttpResponse.json(newEntity);
  }),

  http.get("/api/entities/:id", ({ params }) => {
    const entity = mockEntities.find((e) => e.id === params.id);
    if (entity) {
      return HttpResponse.json(entity);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.put("/api/entities/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const updatedEntity = {
      id: params.id,
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(updatedEntity);
  }),

  http.delete("/api/entities/:id", () => {
    return HttpResponse.json({ success: true });
  }),

  // Relationships endpoints
  http.get("/api/relationships", () => {
    return HttpResponse.json([]);
  }),

  // Suggestions endpoints
  http.post("/api/suggestions/analyze", () => {
    return HttpResponse.json({
      suggestions: [
        {
          id: "suggestion-1",
          type: "add_entity",
          content: "Add new entity suggestion",
          confidence: 0.85,
        },
      ],
    });
  }),
];
