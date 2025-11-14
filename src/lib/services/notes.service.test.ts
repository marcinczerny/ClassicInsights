import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabaseClient } from "@/db/supabase.client";

// Import all functions to test
import { getNotes, createNote, updateNote, addEntityToNote, findNoteById } from "./notes.service";

// Import types
import type { CreateNoteCommand, UpdateNoteCommand } from "@/types";

// Mock Supabase client
vi.mock("@/db/supabase.client", () => ({
  supabaseClient: {
    from: vi.fn(),
  },
}));

describe("Notes Service - Business Rules", () => {
  const mockUserId = "user-123";
  const mockNoteId = "note-456";
  const mockEntityId = "entity-789";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = vi.mocked(supabaseClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Business Rules - Title Uniqueness", () => {
    it("should prevent creating notes with duplicate titles", async () => {
      const command: CreateNoteCommand = {
        title: "Duplicate Title",
        content: "Test content",
      };

      // Mock duplicate check - title exists
      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "existing-note", title: "Duplicate Title" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      await expect(createNote(mockSupabaseClient, mockUserId, command)).rejects.toThrow("A note with this title already exists.");
    });

    it("should prevent updating notes to duplicate titles", async () => {
      const updateCommand: UpdateNoteCommand = {
        title: "Existing Title",
      };

      // Mock existing note fetch
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockNoteId, title: "Original Title", user_id: mockUserId },
          error: null,
        }),
      };

      // Mock duplicate title check - title exists for different note
      const fromMock2 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { id: "other-note", title: "Existing Title" },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      await expect(updateNote(mockSupabaseClient, mockNoteId, mockUserId, updateCommand)).rejects.toThrow(
        "A note with this title already exists."
      );
    });

    it("should allow updating note with same title", async () => {
      const updateCommand: UpdateNoteCommand = {
        title: "Same Title", // Same as existing
        content: "Updated content",
      };

      // Mock existing note fetch
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockNoteId, title: "Same Title", user_id: mockUserId },
          error: null,
        }),
      };

      // Mock update operation
      const fromMock2 = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      };

      // Mock final fetch
      const fromMock3 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: {
            id: mockNoteId,
            title: "Same Title",
            content: "Updated content",
            note_entities: [],
          },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(fromMock1)
        .mockReturnValueOnce(fromMock2)
        .mockReturnValueOnce(fromMock3);

      const result = await updateNote(mockSupabaseClient, mockNoteId, mockUserId, updateCommand);

      expect(result.title).toBe("Same Title");
      expect(result.content).toBe("Updated content");
    });
  });

  describe("Business Rules - Entity Ownership Validation", () => {
    it("should validate entity ownership during note creation", async () => {
      const command: CreateNoteCommand = {
        title: "Test Note",
        entities: [{ entity_id: mockEntityId, relationship_type: "is_related_to" }],
      };

      // Mock duplicate check
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      };

      // Mock entity validation - entity not found or not owned by user
      const fromMock2 = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      await expect(createNote(mockSupabaseClient, mockUserId, command)).rejects.toThrow(
        "One or more entities not found or do not belong to the user."
      );
    });

    it("should validate entity ownership during update", async () => {
      const updateCommand: UpdateNoteCommand = {
        entities: [{ entity_id: mockEntityId, relationship_type: "is_related_to" }],
      };

      // Mock existing note fetch
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockNoteId, title: "Test Note", user_id: mockUserId },
          error: null,
        }),
      };

      // Mock entity validation - entity not owned by user
      const fromMock2 = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      await expect(updateNote(mockSupabaseClient, mockNoteId, mockUserId, updateCommand)).rejects.toThrow(
        "One or more entities not found or do not belong to the user."
      );
    });
  });

  describe("Business Rules - Permission Checks", () => {
    it("should prevent accessing notes from other users", async () => {
      // Mock note fetch - note not found (wrong user)
      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" }, // No rows found
        }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      const result = await findNoteById(mockSupabaseClient, mockNoteId, mockUserId);

      expect(result).toBeNull();
    });

    it("should prevent updating notes from other users", async () => {
      const updateCommand: UpdateNoteCommand = {
        content: "Updated content",
      };

      // Mock note fetch - note not found (wrong user)
      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      await expect(updateNote(mockSupabaseClient, mockNoteId, mockUserId, updateCommand)).rejects.toThrow(
        "Note not found or you do not have permission to edit it."
      );
    });
  });

  describe("Business Rules - Entity Association Management", () => {
    it("should prevent duplicate entity associations", async () => {
      // Mock note check
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockNoteId },
          error: null,
        }),
      };

      // Mock entity check
      const fromMock2 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockEntityId },
          error: null,
        }),
      };

      // Mock existing association check - association exists
      const fromMock3 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { note_id: mockNoteId, entity_id: mockEntityId },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(fromMock1)
        .mockReturnValueOnce(fromMock2)
        .mockReturnValueOnce(fromMock3);

      await expect(addEntityToNote(mockSupabaseClient, mockNoteId, mockEntityId, mockUserId)).rejects.toThrow(
        "This entity is already associated with the note."
      );
    });

    it("should successfully add entity association", async () => {
      const expectedAssociation = {
        note_id: mockNoteId,
        entity_id: mockEntityId,
        type: "is_related_to",
      };

      // Mock note check
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockNoteId },
          error: null,
        }),
      };

      // Mock entity check
      const fromMock2 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockEntityId },
          error: null,
        }),
      };

      // Mock existing association check - no existing association
      const fromMock3 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      };

      // Mock association creation
      const fromMock4 = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: expectedAssociation,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(fromMock1)
        .mockReturnValueOnce(fromMock2)
        .mockReturnValueOnce(fromMock3)
        .mockReturnValueOnce(fromMock4);

      const result = await addEntityToNote(mockSupabaseClient, mockNoteId, mockEntityId, mockUserId);

      expect(result).toEqual(expectedAssociation);
    });
  });

  describe("Business Rules - Data Transformation", () => {
    it("should properly transform note data with entities", async () => {
      const mockNoteData = {
        id: mockNoteId,
        title: "Test Note",
        content: "Test content",
        user_id: mockUserId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        note_entities: [
          {
            type: "is_related_to",
            entities: {
              id: mockEntityId,
              name: "Test Entity",
              type: "person",
              description: "Test description",
            },
          },
        ],
      };

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNoteData, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      const result = await findNoteById(mockSupabaseClient, mockNoteId, mockUserId);

      expect(result).toEqual({
        id: mockNoteId,
        title: "Test Note",
        content: "Test content",
        user_id: mockUserId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        entities: [
          {
            id: mockEntityId,
            name: "Test Entity",
            type: "person",
            description: "Test description",
            relationship_type: "is_related_to",
          },
        ],
        note_entities: undefined, // Should be removed
      });
    });

    it("should handle notes without entities", async () => {
      const mockNoteData = {
        id: mockNoteId,
        title: "Note Without Entities",
        content: "Content",
        user_id: mockUserId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        note_entities: [],
      };

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNoteData, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      const result = await findNoteById(mockSupabaseClient, mockNoteId, mockUserId);

      expect(result?.entities).toEqual([]);
      expect((result as unknown as { note_entities?: unknown })?.note_entities).toBeUndefined();
    });
  });

  describe("Business Rules - Relationship Types", () => {
    it("should support different relationship types", async () => {
      const command: CreateNoteCommand = {
        title: "Relationship Test",
        entities: [
          { entity_id: "entity-1", relationship_type: "criticizes" },
          { entity_id: "entity-2", relationship_type: "is_student_of" },
          { entity_id: "entity-3", relationship_type: "expands_on" },
        ],
      };

      // Mock duplicate check
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      };

      // Mock entity validation
      const fromMock2 = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({
          data: [{ id: "entity-1" }, { id: "entity-2" }, { id: "entity-3" }],
          error: null,
        }),
      };

      // Mock note creation
      const fromMock3 = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockNoteId, title: "Relationship Test" },
          error: null,
        }),
      };

      // Mock entity linking
      const fromMock4 = {
        insert: vi.fn().mockResolvedValueOnce({ error: null }),
      };

      // Mock final fetch
      const fromMock5 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockNoteId, title: "Relationship Test", note_entities: [] },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(fromMock1)
        .mockReturnValueOnce(fromMock2)
        .mockReturnValueOnce(fromMock3)
        .mockReturnValueOnce(fromMock4)
        .mockReturnValueOnce(fromMock5);

      const result = await createNote(mockSupabaseClient, mockUserId, command);

      expect(result.title).toBe("Relationship Test");
    });

    it('should default to "is_related_to" when no relationship type specified', async () => {
      // Mock note check
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockNoteId },
          error: null,
        }),
      };

      // Mock entity check
      const fromMock2 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockEntityId },
          error: null,
        }),
      };

      // Mock existing association check
      const fromMock3 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      };

      // Mock association creation
      const fromMock4 = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { note_id: mockNoteId, entity_id: mockEntityId, type: "is_related_to" },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(fromMock1)
        .mockReturnValueOnce(fromMock2)
        .mockReturnValueOnce(fromMock3)
        .mockReturnValueOnce(fromMock4);

      const result = await addEntityToNote(mockSupabaseClient, mockNoteId, mockEntityId, mockUserId);

      expect(result.type).toBe("is_related_to");
    });
  });

  describe("Business Rules - Error Handling", () => {
    it("should handle database connection errors", async () => {
      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: { message: "Connection failed" },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      await expect(getNotes(mockSupabaseClient, mockUserId)).rejects.toThrow("Failed to count notes.");
    });

    it("should handle note creation errors", async () => {
      const command: CreateNoteCommand = {
        title: "Test Note",
      };

      // Mock duplicate check
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      };

      // Mock note creation failure
      const fromMock2 = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: "Insert failed" },
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      await expect(createNote(mockSupabaseClient, mockUserId, command)).rejects.toThrow("Failed to create the note.");
    });

    it("should handle association creation errors", async () => {
      // Mock note check
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockNoteId },
          error: null,
        }),
      };

      // Mock entity check
      const fromMock2 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockEntityId },
          error: null,
        }),
      };

      // Mock existing association check
      const fromMock3 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      };

      // Mock association creation failure
      const fromMock4 = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: "Association creation failed" },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(fromMock1)
        .mockReturnValueOnce(fromMock2)
        .mockReturnValueOnce(fromMock3)
        .mockReturnValueOnce(fromMock4);

      await expect(addEntityToNote(mockSupabaseClient, mockNoteId, mockEntityId, mockUserId)).rejects.toThrow(
        "Failed to create the association."
      );
    });
  });
});
