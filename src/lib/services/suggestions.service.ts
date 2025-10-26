import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { AnalyzeNoteResponseDTO, SuggestionPreviewDTO, SuggestionsListResponseDTO, SuggestionDTO } from "../../types.ts";
import type { Enums } from "../../db/database.types.ts";
import { handleSupabaseError } from "../../db/supabase.client.ts";
import { getProfile } from "./profile.service.ts";
import { findNoteById, addEntityToNote, updateNote } from "./notes.service.ts";
import { createEntity } from "./entities.service.ts";
import { generateSuggestions } from "./ai.service.ts";

/**
 * Custom error class for AI consent validation
 */
export class AIConsentRequiredError extends Error {
	constructor(message: string = "User has not agreed to AI data processing") {
		super(message);
		this.name = "AIConsentRequiredError";
	}
}

/**
 * Custom error class for note content validation
 */
export class NoteContentTooShortError extends Error {
	constructor(message: string = "Note content is too short for analysis") {
		super(message);
		this.name = "NoteContentTooShortError";
	}
}

/**
 * Custom error class for note not found
 */
export class NoteNotFoundError extends Error {
	constructor(message: string = "Note not found") {
		super(message);
		this.name = "NoteNotFoundError";
	}
}

/**
 * Custom error class for forbidden access
 */
export class ForbiddenAccessError extends Error {
	constructor(message: string = "Access to this resource is forbidden") {
		super(message);
		this.name = "ForbiddenAccessError";
	}
}

/**
 * Custom error class for suggestion not found
 */
export class SuggestionNotFoundError extends Error {
	constructor(message: string = "Suggestion not found") {
		super(message);
		this.name = "SuggestionNotFoundError";
	}
}

/**
 * Custom error class for invalid state transition
 */
export class InvalidStateTransitionError extends Error {
	constructor(message: string = "Invalid state transition") {
		super(message);
		this.name = "InvalidStateTransitionError";
	}
}

const MIN_CONTENT_LENGTH = 10;

/**
 * Logs AI service errors to the database for monitoring and debugging
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (can be null for anonymized logging)
 * @param error - The error object from AI service
 * @param noteContent - The note content that caused the error (hashed for privacy)
 */
async function logAIError(
	supabase: SupabaseClient,
	userId: string | null,
	error: Error,
	noteContent: string
): Promise<void> {
	try {
		// Create a simple hash of the content for tracking without storing PII
		const contentHash = await crypto.subtle.digest(
			"SHA-256",
			new TextEncoder().encode(noteContent)
		);
		const hashArray = Array.from(new Uint8Array(contentHash));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

		const { error: logError } = await supabase
			.from("ai_error_logs")
			.insert({
				user_id: userId,
				model_name: "mock-ai-service",
				source_text_hash: hashHex.substring(0, 64),
				error_code: error.name || "UNKNOWN_ERROR",
				error_message: error.message,
			});

		if (logError) {
			console.error("Failed to log AI error:", logError);
		}
	} catch (loggingError) {
		console.error("Error while logging AI error:", loggingError);
	}
}

/**
 * Analyzes a note using AI to generate suggestions
 *
 * Process:
 * 1. Validates user consent for AI data processing
 * 2. Retrieves and validates note ownership and content
 * 3. Calls AI service to generate suggestions
 * 4. Saves suggestions to database
 * 5. Logs any errors that occur during AI processing
 *
 * @param noteId - UUID of the note to analyze
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @returns Analysis results with generated suggestions
 * @throws AIConsentRequiredError if user hasn't agreed to AI processing
 * @throws NoteNotFoundError if note doesn't exist
 * @throws ForbiddenAccessError if note doesn't belong to user
 * @throws NoteContentTooShortError if note content is too short
 * @throws Error for other failures (AI service, database, etc.)
 */
export async function analyzeNote(
	noteId: string,
	supabase: SupabaseClient,
	userId: string
): Promise<AnalyzeNoteResponseDTO> {
	const startTime = Date.now();

	// Step 1: Check user consent for AI processing
	const profile = await getProfile(supabase, userId);
	if (!profile) {
		throw new Error("User profile not found");
	}

	if (!profile.has_agreed_to_ai_data_processing) {
		throw new AIConsentRequiredError();
	}

	// Step 2: Retrieve and validate note
	const note = await findNoteById(supabase, noteId, userId);
	if (!note) {
		throw new NoteNotFoundError();
	}

	// Verify ownership (additional check beyond getNote)
	if (note.user_id !== userId) {
		throw new ForbiddenAccessError();
	}

	// Step 3: Validate note content
	const noteContent = note.content || "";
	if (noteContent.length < MIN_CONTENT_LENGTH) {
		throw new NoteContentTooShortError(
			`Note content must be at least ${MIN_CONTENT_LENGTH} characters long`
		);
	}

	// Step 4: Call AI service to generate suggestions
	let mockSuggestions;
	try {
		mockSuggestions = await generateSuggestions(noteContent);
	} catch (aiError) {
		// Log the AI error
		await logAIError(
			supabase,
			userId,
			aiError as Error,
			noteContent
		);

		// Re-throw with a generic message to avoid leaking internal details
		throw new Error("AI service error occurred during analysis");
	}

	const generationDuration = Date.now() - startTime;

	// Step 5: Save suggestions to database
	const suggestionsToInsert = mockSuggestions.map(suggestion => ({
		user_id: userId,
		note_id: noteId,
		type: suggestion.type,
		status: "pending" as const,
		name: suggestion.name,
		content: suggestion.content,
		suggested_entity_id: suggestion.suggested_entity_id,
		generation_duration_ms: generationDuration,
	}));

	const { data: savedSuggestions, error: insertError } = await supabase
		.from("ai_suggestions")
		.insert(suggestionsToInsert)
		.select("id, type, status, name, content, suggested_entity_id, created_at");

	if (insertError) {
		handleSupabaseError(insertError);
	}

	if (!savedSuggestions || savedSuggestions.length === 0) {
		throw new Error("Failed to save AI suggestions");
	}

	// Step 6: Format and return response
	const suggestionPreviews: SuggestionPreviewDTO[] = savedSuggestions.map(s => ({
		id: s.id,
		type: s.type,
		status: s.status,
		name: s.name,
		content: s.content,
		suggested_entity_id: s.suggested_entity_id,
		created_at: s.created_at,
	}));

	return {
		note_id: noteId,
		suggestions: suggestionPreviews,
		generation_duration_ms: generationDuration,
	};
}

/**
 * Retrieves all AI suggestions for a specific note with optional status filtering
 *
 * Process:
 * 1. Validates note ownership
 * 2. Queries ai_suggestions table filtered by note_id
 * 3. Optionally filters by status if provided
 *
 * @param noteId - UUID of the note
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param filters - Optional filters object with status field
 * @returns List of suggestions for the note
 * @throws NoteNotFoundError if note doesn't exist
 * @throws ForbiddenAccessError if note doesn't belong to user
 * @throws Error for database failures
 */
export async function getSuggestionsForNote(
	noteId: string,
	supabase: SupabaseClient,
	userId: string,
	filters?: { status?: Enums<"suggestion_status"> }
): Promise<SuggestionsListResponseDTO> {
	// Step 1: Verify note exists and belongs to user
	const note = await findNoteById(supabase, noteId, userId);
	if (!note) {
		throw new NoteNotFoundError();
	}

	if (note.user_id !== userId) {
		throw new ForbiddenAccessError();
	}

	// Step 2: Build query for suggestions
	let query = supabase
		.from("ai_suggestions")
		.select("*")
		.eq("note_id", noteId)
		.eq("user_id", userId)
		.order("created_at", { ascending: false });

	// Step 3: Apply optional status filter
	if (filters?.status) {
		query = query.eq("status", filters.status);
	}

	// Step 4: Execute query
	const { data: suggestions, error } = await query;

	if (error) {
		handleSupabaseError(error);
	}

	// Step 5: Return formatted response
	return {
		data: suggestions || [],
	};
}

/**
 * Updates the status of an AI suggestion and executes business logic based on the action
 *
 * Process:
 * 1. Retrieves and validates suggestion ownership and current status
 * 2. Updates suggestion status in database
 * 3. If accepted, executes business logic based on suggestion type:
 *    - new_entity: Creates new entity and links to note
 *    - existing_entity_link: Links existing entity to note
 *    - quote/summary: Appends content to note
 *
 * @param suggestionId - UUID of the suggestion to update
 * @param newStatus - New status: "accepted" or "rejected"
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @returns Updated suggestion record
 * @throws SuggestionNotFoundError if suggestion doesn't exist
 * @throws ForbiddenAccessError if suggestion doesn't belong to user
 * @throws InvalidStateTransitionError if suggestion is not in pending status
 * @throws Error for other failures (database, business logic, etc.)
 */
export async function updateSuggestionStatus(
	suggestionId: string,
	newStatus: "accepted" | "rejected",
	supabase: SupabaseClient,
	userId: string
): Promise<SuggestionDTO> {
	// Step 1: Retrieve and validate suggestion
	const { data: suggestion, error: fetchError } = await supabase
		.from("ai_suggestions")
		.select("*")
		.eq("id", suggestionId)
		.single();

	if (fetchError || !suggestion) {
		if (fetchError?.code === "PGRST116") {
			throw new SuggestionNotFoundError();
		}
		handleSupabaseError(fetchError);
	}

	// Verify ownership
	if (suggestion.user_id !== userId) {
		throw new ForbiddenAccessError("This suggestion does not belong to you");
	}

	// Verify current status is pending
	if (suggestion.status !== "pending") {
		throw new InvalidStateTransitionError(
			`Cannot update suggestion with status "${suggestion.status}". Only pending suggestions can be updated.`
		);
	}

	// Step 2: Update suggestion status
	const { data: updatedSuggestion, error: updateError } = await supabase
		.from("ai_suggestions")
		.update({ status: newStatus })
		.eq("id", suggestionId)
		.select()
		.single();

	if (updateError) {
		handleSupabaseError(updateError);
	}

	if (!updatedSuggestion) {
		throw new Error("Failed to update suggestion status");
	}

	// Step 3: Execute business logic if suggestion was accepted
	if (newStatus === "accepted" && suggestion.note_id) {
		await executeAcceptanceLogic(suggestion, supabase, userId);
	}

	return updatedSuggestion;
}

/**
 * Executes business logic when a suggestion is accepted
 * Handles different suggestion types with appropriate actions
 *
 * @param suggestion - The accepted suggestion
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 */
async function executeAcceptanceLogic(
	suggestion: SuggestionDTO,
	supabase: SupabaseClient,
	userId: string
): Promise<void> {
	const noteId = suggestion.note_id;
	if (!noteId) {
		throw new Error("Suggestion has no associated note");
	}

	try {
		switch (suggestion.type) {
			case "new_entity": {
				// Create new entity from suggestion content
				// Parse the name from suggestion.name (format: "Suggested Person: Plato")
				const entityName = suggestion.name.includes(":")
					? suggestion.name.split(":")[1].trim()
					: suggestion.name;

				// Create the entity
				const newEntity = await createEntity(supabase, userId, {
					name: entityName,
					type: "person", // Default type for AI-suggested entities
					description: suggestion.content,
				});

				// Link the new entity to the note
				await addEntityToNote(
					supabase,
					noteId,
					newEntity.id,
					userId,
					"is_related_to"
				);
				break;
			}

			case "existing_entity_link": {
				// Link existing entity to note
				if (!suggestion.suggested_entity_id) {
					throw new Error("No entity ID provided for existing_entity_link suggestion");
				}

				await addEntityToNote(
					supabase,
					noteId,
					suggestion.suggested_entity_id,
					userId,
					"is_related_to"
				);
				break;
			}

			case "quote":
			case "summary": {
				// Append content to note
				const note = await findNoteById(supabase, noteId, userId);
				if (!note) {
					throw new Error("Note not found for suggestion");
				}

				// Determine the section header based on type
				const sectionHeader = suggestion.type === "quote" ? "## Quotes" : "## Summary";

				// Build new content
				const existingContent = note.content || "";
				const newContent = existingContent
					? `${existingContent}\n\n${sectionHeader}\n\n${suggestion.content}`
					: `${sectionHeader}\n\n${suggestion.content}`;

				// Update the note
				await updateNote(supabase, noteId, userId, {
					content: newContent,
				});
				break;
			}

			default:
				// Log unexpected suggestion type but don't fail
				console.warn(`Unknown suggestion type: ${suggestion.type}`);
		}
	} catch (error) {
		// Log the error but don't throw - the suggestion status has already been updated
		console.error(`Failed to execute acceptance logic for suggestion ${suggestion.id}:`, error);
		// In a production system, you might want to:
		// 1. Revert the suggestion status back to pending
		// 2. Log this to an error tracking service
		// 3. Notify the user that the action partially failed
		throw error; // Re-throw to let the caller handle it
	}
}
