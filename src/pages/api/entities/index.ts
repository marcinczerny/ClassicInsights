import { getEntities } from "@/lib/services/entities.service";
import type { EntitiesListResponseDTO } from "@/types";
import type { APIRoute } from "astro";
import { z } from "zod";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

// Local enum to avoid issues with database.types.ts import
const entityTypes = [
	"person",
	"work",
	"epoch",
	"idea",
	"school",
	"system",
	"other",
] as const;

const getEntitiesQuerySchema = z.object({
	search: z.string().optional(),
	type: z.enum(entityTypes).optional(),
	limit: z.coerce.number().int().positive().max(100).optional().default(50),
	sort: z
		.enum(["name", "created_at", "type", "note_count"])
		.optional()
		.default("name"),
	order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const GET: APIRoute = async (context) => {
	const { locals, url } = context;
	const userId = DEFAULT_USER_ID;

	try {
		const queryParams = Object.fromEntries(url.searchParams.entries());
		const validationResult = getEntitiesQuerySchema.safeParse(queryParams);

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
