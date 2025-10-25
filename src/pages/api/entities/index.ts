import { createEntity, getEntities } from "@/lib/services/entities.service";
import type { CreateEntityCommand, EntitiesListResponseDTO } from "@/types";
import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { createEntitySchema, getEntitiesSchema } from "@/lib/validation";

export const prerender = false;

export const GET: APIRoute = async (context) => {
	const { locals, url } = context;
	const userId = DEFAULT_USER_ID;

	try {
		const queryParams = Object.fromEntries(url.searchParams.entries());
		const validationResult = getEntitiesSchema.safeParse(queryParams);

		if (!validationResult.success) {
			return new Response(
				JSON.stringify({
					message: "Invalid query parameters",
					errors: validationResult.error.flatten(),
				}),
				{ status: 400 },
			);
		}

		const options = validationResult.data;

		const entities = await getEntities(locals.supabase, userId, options);

		const response: EntitiesListResponseDTO = {
			data: entities,
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error fetching entities:", error);
		return new Response(
			JSON.stringify({ message: "Internal Server Error" }),
			{ status: 500 },
		);
	}
};

export const POST: APIRoute = async ({ locals, request }) => {
	const userId = DEFAULT_USER_ID;

	try {
		const body = await request.json();
		const validationResult = createEntitySchema.safeParse(body);

		if (!validationResult.success) {
			return new Response(
				JSON.stringify({
					message: "Invalid request body",
					errors: validationResult.error.flatten(),
				}),
				{ status: 400 },
			);
		}

		const createCommand: CreateEntityCommand = validationResult.data;

		const newEntity = await createEntity(
			locals.supabase,
			userId,
			createCommand,
		);

		return new Response(JSON.stringify(newEntity), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("already exists")) {
			return new Response(JSON.stringify({ message: error.message }), {
				status: 409, // Conflict
			});
		}
		console.error("Error creating entity:", error);
		return new Response(
			JSON.stringify({ message: "Internal Server Error" }),
			{ status: 500 },
		);
	}
};
