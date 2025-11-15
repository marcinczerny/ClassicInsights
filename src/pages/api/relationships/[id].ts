/**
 * API endpoint for individual relationship operations
 * Handles PATCH (update) and DELETE operations
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import {
  updateRelationship,
  deleteRelationship,
} from "../../../lib/services/relationships.service";
import {
  updateRelationshipSchema,
  relationshipIdSchema,
} from "../../../lib/validation/relationships.validation";
import type { ErrorDTO } from "../../../types";

export const prerender = false;

/**
 * PATCH /api/relationships/:id
 * Updates a relationship's type
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // Validate ID parameter
    const validatedParams = relationshipIdSchema.parse(params);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateRelationshipSchema.parse(body);

    // Update relationship via service
    const relationship = await updateRelationship(
      supabase,
      user.id,
      validatedParams.id,
      validatedData
    );

    return new Response(JSON.stringify(relationship), {
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
          message: "Invalid request data",
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

    // Handle not found / access denied errors
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("access denied")) {
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
    }

    // Handle unexpected errors
    console.error("Error in PATCH /api/relationships/:id:", error);
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
 * DELETE /api/relationships/:id
 * Deletes a relationship
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // Validate ID parameter
    const validatedParams = relationshipIdSchema.parse(params);

    // Delete relationship via service
    await deleteRelationship(supabase, user.id, validatedParams.id);

    // Return 204 No Content on success
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const errorResponse: ErrorDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid relationship ID",
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

    // Handle not found / access denied errors
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("access denied")) {
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
    }

    // Handle unexpected errors
    console.error("Error in DELETE /api/relationships/:id:", error);
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
