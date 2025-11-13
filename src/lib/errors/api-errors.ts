/**
 * Custom error classes for API endpoints
 * These errors are designed to be caught and converted to appropriate HTTP responses
 */

/**
 * Error thrown when a requested resource is not found
 * Should be converted to 404 Not Found HTTP response
 */
export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when user doesn't have permission to access a resource
 * Should be converted to 403 Forbidden HTTP response
 */
export class ForbiddenError extends Error {
  constructor(message = "Access to this resource is forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Error thrown when user is not authenticated
 * Should be converted to 401 Unauthorized HTTP response
 */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Error thrown when request validation fails
 * Should be converted to 400 Bad Request HTTP response
 */
export class ValidationError extends Error {
  constructor(message = "Invalid request data") {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when a resource already exists (conflict)
 * Should be converted to 409 Conflict HTTP response
 */
export class ConflictError extends Error {
  constructor(message = "Resource already exists") {
    super(message);
    this.name = "ConflictError";
  }
}
