import type { SupabaseClient } from "@/db/supabase.client";
import { handleSupabaseError } from "@/db/supabase.client";
import type { Enums } from "@/db/database.types";
import type { EntityWithCountDTO } from "@/types";

export type GetEntitiesOptions = {
	search?: string;
	type?: Enums<"entity_type">;
	limit?: number;
	sort?: "name" | "created_at" | "type" | "note_count";
	order?: "asc" | "desc";
};

export const getEntities = async (
	supabase: SupabaseClient,
	userId: string,
	options: GetEntitiesOptions = {},
): Promise<EntityWithCountDTO[]> => {
	const {
		search,
		type,
		limit = 50,
		sort = "name",
		order = "asc",
	} = options;

	let query = supabase
		.from("entities")
		.select("*, note_entities(count)")
		.eq("user_id", userId);

	if (search) {
		query = query.ilike("name", `%${search}%`);
	}

	if (type) {
		query = query.eq("type", type);
	}

	if (sort === "note_count") {
		// Ordering by count of a related table is not directly supported in PostgREST.
		// This would typically be handled by a database function (RPC) or a more complex query.
		// For now, we will sort on other columns. The plan mentions an RPC,
		// which would be the correct way to implement this.
		// We'll stick to simpler sorting for now and can add the RPC later.
	} else if (sort) {
		query = query.order(sort, { ascending: order === "asc" });
	}

	query = query.limit(limit);

	const { data, error } = await query;

	if (error) {
		return handleSupabaseError(error);
	}

	return (
		data?.map((entity) => ({
			...entity,
			// The count is returned as an array with a single object: [{ count: 5 }]
			// We need to extract the count value.
			note_count: Array.isArray(entity.note_entities)
				? entity.note_entities[0]?.count ?? 0
				: 0,
		})) || []
	);
};
