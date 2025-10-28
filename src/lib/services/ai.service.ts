import type { Enums } from "../../db/database.types.ts";

/**
 * Mock suggestion data structure returned by AI service
 */
export type MockSuggestion = {
	type: Enums<"suggestion_type">;
	name: string;
	content: string;
	suggested_entity_id: string | null;
};

/**
 * Mock AI service for generating suggestions from note content
 * In production, this will call a real AI model
 *
 * @param noteContent - The content of the note to analyze
 * @returns Promise with array of mock suggestions
 * @throws Error to simulate AI service failures
 */
export async function generateSuggestions(
	noteContent: string
): Promise<MockSuggestion[]> {
	// Simulate AI processing delay
	await new Promise(resolve => setTimeout(resolve, 100));

	// Simulate occasional AI service errors (10% chance)
	const shouldFail = Math.random() < 0.1;
	if (shouldFail) {
		throw new Error("AI service temporarily unavailable");
	}

	// Return mock suggestions based on content length
	const mockSuggestions: MockSuggestion[] = [];

	// Always suggest a quote if content is long enough
	if (noteContent.length > 50) {
		mockSuggestions.push({
			type: "quote",
			name: "Key excerpt from the text",
			content: noteContent.substring(0, Math.min(100, noteContent.length)) + "...",
			suggested_entity_id: null,
		});
	}

	// Suggest a summary
	mockSuggestions.push({
		type: "summary",
		name: "AI-generated summary",
		content: "This is a mock summary of the note content. It captures the main ideas and key points discussed in the text.",
		suggested_entity_id: null,
	});

	// Suggest a new entity (50% chance)
	if (Math.random() > 0.5) {
		mockSuggestions.push({
			type: "new_entity",
			name: "Suggested Person: Demokryt",
			content: "Ancient Greek philosopher, creator of atomism",
			suggested_entity_id: null,
		});
	}

	// Suggest linking to existing entity (mock UUID)
	// In production, this would be a real entity ID from the database
	mockSuggestions.push({
		type: "existing_entity_link",
		name: "Link to: Platon",
		content: "This note discusses topics related to Aristotle",
		suggested_entity_id: "3c7e9fa6-26aa-4c1c-ad74-82b32ab1071f", // Mock UUID
	});

	return mockSuggestions;
}
