import { z } from "zod";
import type { ErrorDTO } from "../types";

/**
 * Creates a standardized error response
 * @param code - Error code identifier
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param details - Optional additional error details
 * @returns Response object with JSON error body
 */
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
      ...(details && typeof details === 'object' && details !== null ? { details } : {}),
    },
  };

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Handles common service layer errors and converts them to appropriate HTTP responses
 * @param error - The error thrown by service layer
 * @returns Response object with appropriate status code and error message
 */
export function handleServiceError(error: unknown): Response {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return createErrorResponse(
      "VALIDATION_ERROR",
      "Invalid input data",
      400,
      error.errors
    );
  }

  // Handle Supabase/PostgreSQL errors
  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as { code: string; message?: string };

    // Duplicate key violation (unique constraint)
    if (pgError.code === "23505") {
      return createErrorResponse(
        "CONFLICT",
        "Resource already exists",
        409
      );
    }

    // Foreign key violation
    if (pgError.code === "23503") {
      return createErrorResponse(
        "NOT_FOUND",
        "Referenced resource does not exist",
        404
      );
    }

    // Check constraint violation
    if (pgError.code === "23514") {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Data does not meet database constraints",
        400
      );
    }
  }

  // Handle custom application errors
  if (error instanceof Error) {
    // Check for specific error types by name
    if (error.name === "AIConsentRequiredError") {
      return createErrorResponse(
        "AI_CONSENT_REQUIRED",
        error.message,
        400
      );
    }

    if (error.name === "NoteContentTooShortError") {
      return createErrorResponse(
        "NOTE_CONTENT_TOO_SHORT",
        error.message,
        422
      );
    }

    if (error.name === "NoteNotFoundError") {
      return createErrorResponse(
        "NOTE_NOT_FOUND",
        error.message,
        404
      );
    }

    if (error.name === "ForbiddenAccessError") {
      return createErrorResponse(
        "FORBIDDEN_ACCESS",
        error.message,
        403
      );
    }

    if (error.name === "SuggestionNotFoundError") {
      return createErrorResponse(
        "SUGGESTION_NOT_FOUND",
        error.message,
        404
      );
    }

    if (error.name === "InvalidStateTransitionError") {
      return createErrorResponse(
        "INVALID_STATE_TRANSITION",
        error.message,
        400
      );
    }

    // Check for specific error messages
    if (error.message.includes("not found") || error.message.includes("Not found")) {
      return createErrorResponse(
        "NOT_FOUND",
        error.message,
        404
      );
    }

    if (error.message.includes("unauthorized") || error.message.includes("Unauthorized")) {
      return createErrorResponse(
        "UNAUTHORIZED",
        error.message,
        401
      );
    }

    if (error.message.includes("forbidden") || error.message.includes("Forbidden")) {
      return createErrorResponse(
        "FORBIDDEN",
        error.message,
        403
      );
    }

    if (error.message.includes("AI service error")) {
      return createErrorResponse(
        "AI_SERVICE_ERROR",
        error.message,
        500
      );
    }
  }

  // Log unexpected errors for debugging
  console.error("Unexpected error:", error);

  // Return generic internal server error
  return createErrorResponse(
    "INTERNAL_ERROR",
    "An unexpected error occurred",
    500
  );
}

/**
 * Creates a 401 Unauthorized response
 */
export function createUnauthorizedResponse(): Response {
  return createErrorResponse(
    "UNAUTHORIZED",
    "Not authenticated",
    401
  );
}

/**
 * Creates a 404 Not Found response
 * @param resource - The type of resource that was not found (e.g., "Note", "Entity")
 */
export function createNotFoundResponse(resource: string): Response {
  return createErrorResponse(
    "NOT_FOUND",
    `${resource} not found`,
    404
  );
}

/**
 * Creates a 409 Conflict response
 * @param message - Specific conflict message
 */
export function createConflictResponse(message: string): Response {
  return createErrorResponse(
    "CONFLICT",
    message,
    409
  );
}
