import { deleteEntity, getEntityById, updateEntity } from "@/lib/services/entities.service";
import { deleteEntitySchema, getEntitySchema, updateEntitySchema } from "@/lib/validation";
import type { UpdateEntityCommand } from "@/types";
import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { handleServiceError, createErrorResponse, createNotFoundResponse } from "@/lib/errors";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
	// TODO: Replace with actual authentication
	// const session = await locals.supabase.auth.getSession();
	// if (!session.data.session) {
	//   return createUnauthorizedResponse();
	// }
	// const userId = session.data.session.user.id;
	const userId = DEFAULT_USER_ID;

	const validationResult = getEntitySchema.safeParse(params);

	if (!validationResult.success) {
		return createErrorResponse(
			"VALIDATION_ERROR",
			"Invalid entity ID",
			400,
			validationResult.error.errors
		);
	}

	const { id: entityId } = validationResult.data;

	try {
		const entity = await getEntityById(locals.supabase, userId, entityId);

		if (!entity) {
			return createNotFoundResponse("Entity");
		}

		return new Response(JSON.stringify(entity), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleServiceError(error);
	}
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
	// TODO: Replace with actual authentication
	// const session = await locals.supabase.auth.getSession();
	// if (!session.data.session) {
	//   return createUnauthorizedResponse();
	// }
	// const userId = session.data.session.user.id;
	const userId = DEFAULT_USER_ID;

	const idValidationResult = getEntitySchema.safeParse(params);

	if (!idValidationResult.success) {
		return createErrorResponse(
			"VALIDATION_ERROR",
			"Invalid entity ID",
			400,
			idValidationResult.error.errors
		);
	}

	const { id: entityId } = idValidationResult.data;

	try {
		const body = await request.json();
		const bodyValidationResult = updateEntitySchema.safeParse(body);

		if (!bodyValidationResult.success) {
			return createErrorResponse(
				"VALIDATION_ERROR",
				"Invalid request body",
				400,
				bodyValidationResult.error.errors
			);
		}

		const updateCommand: UpdateEntityCommand = bodyValidationResult.data;

		const updatedEntity = await updateEntity(
			locals.supabase,
			userId,
			entityId,
			updateCommand,
		);

		return new Response(JSON.stringify(updatedEntity), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleServiceError(error);
	}
};

export const DELETE: APIRoute = async ({ params, locals }) => {
	// TODO: Replace with actual authentication
	// const session = await locals.supabase.auth.getSession();
	// if (!session.data.session) {
	//   return createUnauthorizedResponse();
	// }
	// const userId = session.data.session.user.id;
	const userId = DEFAULT_USER_ID;

	const validationResult = deleteEntitySchema.safeParse(params);

	if (!validationResult.success) {
		return createErrorResponse(
			"VALIDATION_ERROR",
			"Invalid entity ID",
			400,
			validationResult.error.errors
		);
	}

	const { id: entityId } = validationResult.data;

	try {
		const result = await deleteEntity(locals.supabase, userId, entityId);

		if (!result.success) {
			return createNotFoundResponse("Entity");
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		return handleServiceError(error);
	}
};
