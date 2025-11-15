import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabaseClient } from "@/db/supabase.client";
import { getProfile } from "./profile.service";
import { findNoteById, addEntityToNote, updateNote } from "./notes.service";
import { createEntity, findEntityByName, getEntities } from "./entities.service";

// Import all functions to test
import {
  generateSuggestionsForNote,
  getSuggestionsForNote,
  updateSuggestionStatus,
} from "./suggestions.service";

// Import types
import type { SuggestionDTO } from "@/types";

// Mock external dependencies
vi.mock("@/db/supabase.client", () => ({
  supabaseClient: {
    from: vi.fn(),
  },
  handleSupabaseError: vi.fn((error) => {
    throw new Error(`Database error: ${error.message}`);
  }),
}));

vi.mock("./profile.service", () => ({
  getProfile: vi.fn(),
}));

vi.mock("./notes.service", () => ({
  findNoteById: vi.fn(),
  addEntityToNote: vi.fn(),
  updateNote: vi.fn(),
}));

vi.mock("./entities.service", () => ({
  createEntity: vi.fn(),
  getEntities: vi.fn(),
  findEntityByName: vi.fn(),
}));

const mockGetStructuredResponse = vi.fn();
vi.mock("./ai.service", () => ({
  OpenRouterService: class MockOpenRouterService {
    getStructuredResponse = mockGetStructuredResponse;
  },
}));

describe("Suggestions Service - Business Rules", () => {
  const mockUserId = "user-123";
  const mockNoteId = "note-456";
  const mockSuggestionId = "suggestion-789";
  const mockEntityId = "entity-999";
  const mockOpenRouterApiKey = "test-api-key";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGetProfile: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFindNoteById: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAddEntityToNote: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockUpdateNote: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCreateEntity: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGetEntities: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFindEntityByName: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = vi.mocked(supabaseClient);
    mockGetProfile = vi.mocked(getProfile);
    mockFindNoteById = vi.mocked(findNoteById);
    mockAddEntityToNote = vi.mocked(addEntityToNote);
    mockUpdateNote = vi.mocked(updateNote);
    mockCreateEntity = vi.mocked(createEntity);
    mockGetEntities = vi.mocked(getEntities);
    mockFindEntityByName = vi.mocked(findEntityByName);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Business Rules - AI Data Processing Consent", () => {
    it("should prevent generating suggestions when user has not agreed to AI data processing", async () => {
      mockGetProfile.mockResolvedValueOnce({
        has_agreed_to_ai_data_processing: false,
      });

      await expect(
        generateSuggestionsForNote(mockSupabaseClient, mockNoteId, mockUserId, mockOpenRouterApiKey)
      ).rejects.toThrow("User has not agreed to AI data processing.");

      expect(mockGetProfile).toHaveBeenCalledWith(mockSupabaseClient, mockUserId);
    });

    it("should prevent generating suggestions when profile is null", async () => {
      mockGetProfile.mockResolvedValueOnce(null);

      await expect(
        generateSuggestionsForNote(mockSupabaseClient, mockNoteId, mockUserId, mockOpenRouterApiKey)
      ).rejects.toThrow("User has not agreed to AI data processing.");
    });
  });

  describe("Business Rules - Note Access Validation", () => {
    it("should prevent generating suggestions for non-existent notes", async () => {
      mockGetProfile.mockResolvedValueOnce({
        has_agreed_to_ai_data_processing: true,
      });

      mockFindNoteById.mockResolvedValueOnce(null);

      await expect(
        generateSuggestionsForNote(mockSupabaseClient, mockNoteId, mockUserId, mockOpenRouterApiKey)
      ).rejects.toThrow("Note not found or access denied.");
    });

    it("should prevent generating suggestions for notes owned by other users", async () => {
      mockGetProfile.mockResolvedValueOnce({
        has_agreed_to_ai_data_processing: true,
      });

      mockFindNoteById.mockResolvedValueOnce({
        id: mockNoteId,
        user_id: "other-user",
        content: "Some content",
        entities: [],
      });

      await expect(
        generateSuggestionsForNote(mockSupabaseClient, mockNoteId, mockUserId, mockOpenRouterApiKey)
      ).rejects.toThrow("Note not found or access denied.");
    });
  });

  describe("Business Rules - Content Length Validation", () => {
    it("should prevent generating suggestions for notes with content shorter than minimum length", async () => {
      mockGetProfile.mockResolvedValueOnce({
        has_agreed_to_ai_data_processing: true,
      });

      mockFindNoteById.mockResolvedValueOnce({
        id: mockNoteId,
        user_id: mockUserId,
        content: "Short",
        entities: [],
      });

      await expect(
        generateSuggestionsForNote(mockSupabaseClient, mockNoteId, mockUserId, mockOpenRouterApiKey)
      ).rejects.toThrow("Note content must be at least 10 characters long.");
    });
  });

  describe("Business Rules - Suggestion Generation", () => {
    it("should successfully generate and save suggestions", async () => {
      mockGetProfile.mockResolvedValueOnce({
        has_agreed_to_ai_data_processing: true,
      });

      mockFindNoteById.mockResolvedValueOnce({
        id: mockNoteId,
        user_id: mockUserId,
        content: "This is a test note content for AI suggestions.",
        entities: [
          { id: "entity-1", name: "Test Entity", type: "person" as const, description: null },
        ],
      });

      mockGetEntities.mockResolvedValueOnce([
        {
          id: "user-entity-1",
          name: "User Entity",
          type: "work" as const,
          description: "User description",
        },
      ]);

      const mockAISuggestions = [
        {
          type: "quote" as const,
          name: "Quote Suggestion",
          content: "This is a quote from the note.",
          suggested_entity_id: null,
        },
        {
          type: "new_entity" as const,
          name: "New Entity Suggestion",
          content: "Description of new entity",
          suggested_entity_id: null,
        },
      ];

      mockGetStructuredResponse.mockResolvedValueOnce({
        suggestions: mockAISuggestions,
      });

      const expectedSavedSuggestions = mockAISuggestions.map((suggestion, index) => ({
        id: `saved-suggestion-${index}`,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: suggestion.type,
        status: "pending" as const,
        name: suggestion.name,
        content: suggestion.content,
        suggested_entity_id: suggestion.suggested_entity_id,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      }));

      const fromMockGet = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
      };

      const fromMockInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValueOnce({ data: expectedSavedSuggestions, error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(fromMockGet)
        .mockReturnValueOnce(fromMockInsert);

      const result = await generateSuggestionsForNote(
        mockSupabaseClient,
        mockNoteId,
        mockUserId,
        mockOpenRouterApiKey
      );

      expect(result).toEqual(expectedSavedSuggestions);
      expect(mockGetStructuredResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe("Business Rules - Suggestion Retrieval", () => {
    it("should retrieve all suggestions for a note", async () => {
      const mockSuggestions: SuggestionDTO[] = [
        {
          id: "suggestion-1",
          user_id: mockUserId,
          note_id: mockNoteId,
          type: "quote",
          status: "pending",
          name: "Quote 1",
          content: "Quote content",
          suggested_entity_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          generation_duration_ms: null,
        },
        {
          id: "suggestion-2",
          user_id: mockUserId,
          note_id: mockNoteId,
          type: "summary",
          status: "accepted",
          name: "Summary 1",
          content: "Summary content",
          suggested_entity_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          generation_duration_ms: null,
        },
      ];

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: mockSuggestions, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      const result = await getSuggestionsForNote(mockSupabaseClient, mockNoteId, mockUserId);

      expect(result).toEqual(mockSuggestions);
    });

    it("should retrieve only pending suggestions for a note when filtered by status", async () => {
      const mockSuggestions: SuggestionDTO[] = [
        {
          id: "suggestion-1",
          user_id: mockUserId,
          note_id: mockNoteId,
          type: "quote",
          status: "pending",
          name: "Quote 1",
          content: "Quote content",
          suggested_entity_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          generation_duration_ms: null,
        },
      ];

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: mockSuggestions, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      const result = await getSuggestionsForNote(
        mockSupabaseClient,
        mockNoteId,
        mockUserId,
        "pending"
      );

      expect(result).toEqual(mockSuggestions);
      expect(fromMock.eq).toHaveBeenCalledWith("status", "pending");
    });

    it("should retrieve pending and accepted suggestions when filtered by an array of statuses", async () => {
      const mockSuggestions: SuggestionDTO[] = [
        {
          id: "suggestion-1",
          user_id: mockUserId,
          note_id: mockNoteId,
          type: "quote",
          status: "pending",
          name: "Quote 1",
          content: "Quote content",
          suggested_entity_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          generation_duration_ms: null,
        },
        {
          id: "suggestion-2",
          user_id: mockUserId,
          note_id: mockNoteId,
          type: "summary",
          status: "accepted",
          name: "Summary 1",
          content: "Summary content",
          suggested_entity_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          generation_duration_ms: null,
        },
      ];

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: mockSuggestions, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      const result = await getSuggestionsForNote(mockSupabaseClient, mockNoteId, mockUserId, [
        "pending",
        "accepted",
      ]);

      expect(result).toEqual(mockSuggestions);
      expect(fromMock.in).toHaveBeenCalledWith("status", ["pending", "accepted"]);
    });
  });

  describe("Business Rules - Suggestion Status Updates", () => {
    it("should prevent updating non-pending suggestions", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: "quote",
        status: "accepted", // Already accepted
        name: "Quote",
        content: "Content",
        suggested_entity_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      await expect(
        updateSuggestionStatus(mockSupabaseClient, mockUserId, mockSuggestionId, "rejected")
      ).rejects.toThrow("Only pending suggestions can be updated.");
    });

    it("should prevent accessing suggestions from other users", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: "other-user",
        note_id: mockNoteId,
        type: "quote",
        status: "pending",
        name: "Quote",
        content: "Content",
        suggested_entity_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      await expect(
        updateSuggestionStatus(mockSupabaseClient, mockUserId, mockSuggestionId, "accepted")
      ).rejects.toThrow("Suggestion not found or access denied");
    });

    it("should successfully reject a pending suggestion", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: "quote",
        status: "pending",
        name: "Quote",
        content: "Content",
        suggested_entity_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const updatedSuggestion: SuggestionDTO = {
        ...mockSuggestion,
        status: "rejected",
        updated_at: "2024-01-01T01:00:00Z",
      };

      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };

      const fromMock2 = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: updatedSuggestion, error: null }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      const result = await updateSuggestionStatus(
        mockSupabaseClient,
        mockUserId,
        mockSuggestionId,
        "rejected"
      );

      expect(result).toEqual(updatedSuggestion);
      expect(mockAddEntityToNote).not.toHaveBeenCalled();
      expect(mockCreateEntity).not.toHaveBeenCalled();
      expect(mockUpdateNote).not.toHaveBeenCalled();
    });
  });

  describe("Business Rules - Acceptance Logic - New Entity", () => {
    it("should create new entity and link it to note when accepting new_entity suggestion", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: "new_entity",
        status: "pending",
        name: "New Entity: Aristotle",
        content: "Ancient Greek philosopher",
        suggested_entity_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const mockNote = {
        id: mockNoteId,
        user_id: mockUserId,
        entities: [],
      };

      const mockNewEntity = {
        id: mockEntityId,
        name: "Aristotle",
        type: "person",
        description: "Ancient Greek philosopher",
      };

      const updatedSuggestion: SuggestionDTO = {
        ...mockSuggestion,
        status: "accepted",
        updated_at: "2024-01-01T01:00:00Z",
      };

      // Mock suggestion fetch
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };

      // Mock suggestion update
      const fromMock2 = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: updatedSuggestion, error: null }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      mockFindNoteById.mockResolvedValueOnce(mockNote);
      mockFindEntityByName.mockResolvedValueOnce(null);
      mockCreateEntity.mockResolvedValueOnce(mockNewEntity);
      mockAddEntityToNote.mockResolvedValueOnce({});

      const result = await updateSuggestionStatus(
        mockSupabaseClient,
        mockUserId,
        mockSuggestionId,
        "accepted"
      );

      expect(result).toEqual(updatedSuggestion);
      expect(mockCreateEntity).toHaveBeenCalledWith(mockSupabaseClient, mockUserId, {
        name: "Aristotle",
        type: "person",
        description: "Ancient Greek philosopher",
      });
      expect(mockAddEntityToNote).toHaveBeenCalledWith(
        mockSupabaseClient,
        mockNoteId,
        mockEntityId,
        mockUserId,
        "is_related_to"
      );
    });

    it("should handle entity names without colon prefix", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: "new_entity",
        status: "pending",
        name: "Plato", // No colon prefix
        content: "Another Greek philosopher",
        suggested_entity_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const mockNote = {
        id: mockNoteId,
        user_id: mockUserId,
        entities: [],
      };

      const updatedSuggestion: SuggestionDTO = {
        ...mockSuggestion,
        status: "accepted",
        updated_at: "2024-01-01T01:00:00Z",
      };

      // Mock suggestion fetch
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };

      // Mock suggestion update
      const fromMock2 = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: updatedSuggestion, error: null }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      mockFindNoteById.mockResolvedValueOnce(mockNote);
      mockFindEntityByName.mockResolvedValueOnce(null);
      mockCreateEntity.mockResolvedValueOnce({
        id: mockEntityId,
        name: "Plato",
        type: "person",
        description: "Another Greek philosopher",
      });
      mockAddEntityToNote.mockResolvedValueOnce({});

      await updateSuggestionStatus(mockSupabaseClient, mockUserId, mockSuggestionId, "accepted");

      expect(mockCreateEntity).toHaveBeenCalledWith(mockSupabaseClient, mockUserId, {
        name: "Plato",
        type: "person",
        description: "Another Greek philosopher",
      });
    });
  });

  describe("Business Rules - Acceptance Logic - Existing Entity Link", () => {
    it("should link existing entity to note when accepting existing_entity_link suggestion", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: "existing_entity_link",
        status: "pending",
        name: "Link Existing Entity",
        content: "Link description",
        suggested_entity_id: mockEntityId,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const mockNote = {
        id: mockNoteId,
        user_id: mockUserId,
        entities: [],
      };

      const updatedSuggestion: SuggestionDTO = {
        ...mockSuggestion,
        status: "accepted",
        updated_at: "2024-01-01T01:00:00Z",
      };

      // Mock suggestion fetch
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };

      // Mock suggestion update
      const fromMock2 = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: updatedSuggestion, error: null }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      mockFindNoteById.mockResolvedValueOnce(mockNote);
      mockAddEntityToNote.mockResolvedValueOnce({});

      const result = await updateSuggestionStatus(
        mockSupabaseClient,
        mockUserId,
        mockSuggestionId,
        "accepted"
      );

      expect(result).toEqual(updatedSuggestion);
      expect(mockAddEntityToNote).toHaveBeenCalledWith(
        mockSupabaseClient,
        mockNoteId,
        mockEntityId,
        mockUserId,
        "is_related_to"
      );
      expect(mockCreateEntity).not.toHaveBeenCalled();
      expect(mockUpdateNote).not.toHaveBeenCalled();
    });

    it("should throw error when existing_entity_link suggestion has no suggested_entity_id", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: "existing_entity_link",
        status: "pending",
        name: "Link Existing Entity",
        content: "Link description",
        suggested_entity_id: null, // Missing entity ID
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const mockNote = {
        id: mockNoteId,
        user_id: mockUserId,
        entities: [],
      };

      // Mock suggestion fetch
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };

      // Mock suggestion update
      const fromMock2 = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { ...mockSuggestion, status: "accepted" },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      mockFindNoteById.mockResolvedValueOnce(mockNote);

      await expect(
        updateSuggestionStatus(mockSupabaseClient, mockUserId, mockSuggestionId, "accepted")
      ).rejects.toThrow("No entity ID provided");
    });
  });

  describe("Business Rules - Acceptance Logic - Quote/Summary", () => {
    it("should add quote to note content when accepting quote suggestion", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: "quote",
        status: "pending",
        name: "Quote Suggestion",
        content: "This is a famous quote from the text.",
        suggested_entity_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const mockNote = {
        id: mockNoteId,
        user_id: mockUserId,
        content: "Original note content.",
        entities: [],
      };

      const updatedSuggestion: SuggestionDTO = {
        ...mockSuggestion,
        status: "accepted",
        updated_at: "2024-01-01T01:00:00Z",
      };

      // Mock suggestion fetch
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };

      // Mock suggestion update
      const fromMock2 = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: updatedSuggestion, error: null }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      mockFindNoteById.mockResolvedValueOnce(mockNote);
      mockUpdateNote.mockResolvedValueOnce({});

      const result = await updateSuggestionStatus(
        mockSupabaseClient,
        mockUserId,
        mockSuggestionId,
        "accepted"
      );

      expect(result).toEqual(updatedSuggestion);
      expect(mockUpdateNote).toHaveBeenCalledWith(mockSupabaseClient, mockNoteId, mockUserId, {
        content: "Original note content.\n\n## Quotes\n\nThis is a famous quote from the text.",
      });
      expect(mockCreateEntity).not.toHaveBeenCalled();
      expect(mockAddEntityToNote).not.toHaveBeenCalled();
    });

    it("should add summary to note content when accepting summary suggestion", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: "summary",
        status: "pending",
        name: "Summary Suggestion",
        content: "This is a summary of the note content.",
        suggested_entity_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const mockNote = {
        id: mockNoteId,
        user_id: mockUserId,
        content: "Original note content.",
        entities: [],
      };

      const updatedSuggestion: SuggestionDTO = {
        ...mockSuggestion,
        status: "accepted",
        updated_at: "2024-01-01T01:00:00Z",
      };

      // Mock suggestion fetch
      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };

      // Mock suggestion update
      const fromMock2 = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: updatedSuggestion, error: null }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      mockFindNoteById.mockResolvedValueOnce(mockNote);
      mockUpdateNote.mockResolvedValueOnce({});

      const result = await updateSuggestionStatus(
        mockSupabaseClient,
        mockUserId,
        mockSuggestionId,
        "accepted"
      );

      expect(result).toEqual(updatedSuggestion);
      expect(mockUpdateNote).toHaveBeenCalledWith(mockSupabaseClient, mockNoteId, mockUserId, {
        content: "Original note content.\n\n## Summary\n\nThis is a summary of the note content.",
      });
    });
  });

  describe("Business Rules - Error Handling", () => {
    it("should handle database errors during suggestion retrieval", async () => {
      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: "Query failed" },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(fromMock);

      await expect(
        getSuggestionsForNote(mockSupabaseClient, mockNoteId, mockUserId)
      ).rejects.toThrow("Database error: Query failed");
    });

    it("should handle database errors during suggestion status update", async () => {
      const mockSuggestion: SuggestionDTO = {
        id: mockSuggestionId,
        user_id: mockUserId,
        note_id: mockNoteId,
        type: "quote",
        status: "pending",
        name: "Quote",
        content: "Content",
        suggested_entity_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        generation_duration_ms: null,
      };

      const fromMock1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockSuggestion, error: null }),
      };

      const fromMock2 = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: "Update failed" },
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(fromMock1).mockReturnValueOnce(fromMock2);

      await expect(
        updateSuggestionStatus(mockSupabaseClient, mockUserId, mockSuggestionId, "accepted")
      ).rejects.toThrow("Failed to update suggestion status");
    });
  });
});
