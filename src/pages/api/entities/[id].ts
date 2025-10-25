import { deleteEntity, getEntityById, updateEntity } from "@/lib/services/entities.service";
import { deleteEntitySchema, getEntitySchema, updateEntitySchema } from "@/lib/validation";
import type { UpdateEntityCommand } from "@/types";
import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
	const userId = DEFAULT_USER_ID;

	const validationResult = getEntitySchema.safeParse(params);

	if (!validationResult.success) {
		return new Response(
			JSON.stringify({
				message: "Invalid entity ID format",
				errors: validationResult.error.flatten(),
			}),
			{ status: 400 },
		);
	}

	const { id: entityId } = validationResult.data;

	try {
		const entity = await getEntityById(locals.supabase, userId, entityId);

		if (!entity) {
			return new Response(JSON.stringify({ message: "Entity not found" }), {
				status: 404,
			});
		}

		return new Response(JSON.stringify(entity), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error fetching entity:", error);
		return new Response(
			JSON.stringify({ message: "Internal Server Error" }),
			{ status: 500 },
		);
	}
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
	const userId = DEFAULT_USER_ID;

	const idValidationResult = getEntitySchema.safeParse(params);

	if (!idValidationResult.success) {
		return new Response(
			JSON.stringify({
				message: "Invalid entity ID format",
				errors: idValidationResult.error.flatten(),
			}),
			{ status: 400 },
		);
	}

	const { id: entityId } = idValidationResult.data;

	try {
		const body = await request.json();
		const bodyValidationResult = updateEntitySchema.safeParse(body);

		if (!bodyValidationResult.success) {
			return new Response(
				JSON.stringify({
					message: "Invalid request body",
					errors: bodyValidationResult.error.flatten(),
				}),
				{ status: 400 },
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
		if (error instanceof Error) {
			if (error.message.includes("already exists")) {
				return new Response(JSON.stringify({ message: error.message }), {
					status: 409,
				});
			}
			if (error.message.includes("not found")) {
				return new Response(JSON.stringify({ message: error.message }), {
					status: 404,
				});
			}
		}
		console.error("Error updating entity:", error);
		return new Response(
			JSON.stringify({ message: "Internal Server Error" }),
			{ status: 500 },
		);
	}
};

export const DELETE: APIRoute = async ({ params, locals }) => {
	const userId = DEFAULT_USER_ID;

	const validationResult = deleteEntitySchema.safeParse(params);

	if (!validationResult.success) {
		return new Response(
			JSON.stringify({
				message: "Invalid entity ID format",
				errors: validationResult.error.flatten(),
			}),
			{ status: 400 },
		);
	}

	const { id: entityId } = validationResult.data;

	try {
		const result = await deleteEntity(locals.supabase, userId, entityId);

		if (!result.success) {
			return new Response(JSON.stringify({ message: "Entity not found" }), {
				status: 404,
			});
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		console.error("Error deleting entity:", error);
		return new Response(
			JSON.stringify({ message: "Internal Server Error" }),
			{ status: 500 },
		);
	}
};
