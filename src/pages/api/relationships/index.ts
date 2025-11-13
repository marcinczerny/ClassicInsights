/**
 * API endpoint for relationships collection
 * Handles GET (list) and POST (create) operations
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { RelationshipsService } from "../../../lib/services/relationships.service";
import {
  getRelationshipsQuerySchema,
  createRelationshipSchema,
} from "../../../lib/validation/relationships.validation";
import type { RelationshipsListResponseDTO, ErrorDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/relationships
 * Retrieves a list of relationships with optional filtering and pagination
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validatedQuery = getRelationshipsQuerySchema.parse(queryParams);

    // Get relationships from service
    const service = new RelationshipsService();
    const response = await service.getRelationships(user.id, validatedQuery);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const errorResponse: ErrorDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: error.errors,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle other errors
    console.error("Error in GET /api/relationships:", error);
    const errorResponse: ErrorDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

/**
 * POST /api/relationships
 * Creates a new relationship between two entities
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createRelationshipSchema.parse(body);

    // Create relationship via service
    const service = new RelationshipsService();
    const relationship = await service.createRelationship(user.id, validatedData);

    return new Response(JSON.stringify(relationship), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const errorResponse: ErrorDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: error.errors,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle business logic errors
    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes("not found") || error.message.includes("do not belong to user")) {
        const errorResponse: ErrorDTO = {
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      if (error.message.includes("already exists") || error.message.includes("itself")) {
        const errorResponse: ErrorDTO = {
          error: {
            code: "BAD_REQUEST",
            message: error.message,
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }

    // Handle unexpected errors
    console.error("Error in POST /api/relationships:", error);
    const errorResponse: ErrorDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
