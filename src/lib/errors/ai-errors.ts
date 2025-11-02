/**
 * Custom error classes for AI service operations
 * These errors are specific to interactions with AI/LLM providers
 */

/**
 * Base error class for all AI-related errors
 */
export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when API authentication fails
 * Indicates invalid or missing API key
 */
export class AuthenticationError extends AIError {}

/**
 * Error thrown when the API request is malformed
 * Indicates invalid parameters or request structure
 */
export class BadRequestError extends AIError {}

/**
 * Error thrown when API rate limits are exceeded
 * Should be handled with backoff/retry strategy
 */
export class RateLimitError extends AIError {}

/**
 * Error thrown when the requested model is not found
 * Indicates an invalid model identifier
 */
export class NotFoundError extends AIError {}

/**
 * Error thrown for server-side issues on the AI provider's end
 * Indicates 5xx status codes from the API
 */
export class APIError extends AIError {}

/**
 * Error thrown for network connectivity issues or timeouts
 * Indicates network-level failures
 */
export class NetworkError extends AIError {}

/**
 * Error thrown when AI response validation fails
 * Indicates the response doesn't match the expected schema or isn't valid JSON
 */
export class ResponseValidationError extends AIError {}
