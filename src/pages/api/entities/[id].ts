import { getEntityById } from "@/lib/services/entities.service";
import { getEntitySchema } from "@/lib/validation";
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
