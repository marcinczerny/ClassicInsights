import type { SupabaseClient } from "@/db/supabase.client";
import { handleSupabaseError } from "@/db/supabase.client";
import type { Enums } from "@/db/database.types";
import type { EntityWithCountDTO } from "@/types";
import type { CreateEntityCommand, EntityDTO } from "@/types";
import type { EntityWithNotesDTO, UpdateEntityCommand } from "@/types";

export type GetEntitiesOptions = {
	search?: string;
	type?: Enums<"entity_type">;
	page?: number;
	limit?: number;
	sort?: "name" | "created_at" | "type";
	order?: "asc" | "desc";
};

export const getEntities = async (
	supabase: SupabaseClient,
	userId: string,
	options: GetEntitiesOptions = {},
): Promise<{ data: EntityWithCountDTO[], count: number }> => {
	const {
		search,
		type,
		page = 1,
		limit = 50,
		sort = "name",
		order = "asc",
	} = options;

	const rangeFrom = (page - 1) * limit;
	const rangeTo = page * limit - 1;

	let query = supabase
		.from("entities")
		.select("*, note_entities(count)", { count: "exact" })
		.eq("user_id", userId);

	if (search) {
		query = query.ilike("name", `%${search}%`);
	}

	if (type) {
		query = query.eq("type", type);
	}

	const sortField = sort ?? "created_at";
	query = query.order(sortField, { ascending: order === "asc" });

	query = query.range(rangeFrom, rangeTo);

	const { data, error, count } = await query;

	if (error) {
		return handleSupabaseError(error);
	}

	const entities =
		data?.map((entity) => ({
			...entity,
			// The count is returned as an array with a single object: [{ count: 5 }]
			// We need to extract the count value.
			note_count: Array.isArray(entity.note_entities)
				? entity.note_entities[0]?.count ?? 0
				: 0,
		})) || [];
	
	return { data: entities, count: count ?? 0 };
};

export const createEntity = async (
	supabase: SupabaseClient,
	userId: string,
	data: CreateEntityCommand,
): Promise<EntityDTO> => {
	const { name, type, description } = data;

	const { data: newEntity, error } = await supabase
		.from("entities")
		.insert({
			user_id: userId,
			name,
			type,
			description: description || null,
		})
		.select()
		.single();

	const UNIQUE_CONSTRAINT_VIOLATION_CODE = "23505"; // Postgres unique constraint violation
	if (error) {
		if (error.code === UNIQUE_CONSTRAINT_VIOLATION_CODE) {
			// unique constraint violation
			throw new Error(`An entity with the name "${name}" already exists.`);
		}
		return handleSupabaseError(error);
	}

	if (!newEntity) {
		throw new Error("Failed to create entity.");
	}

	return newEntity;
};

const POSTGRES_ERROR_NOT_FOUND = "PGRST116";

export const getEntityById = async (
	supabase: SupabaseClient,
	userId: string,
	entityId: string,
): Promise<EntityWithNotesDTO | null> => {
	const { data, error } = await supabase
		.from("entities")
		.select("*, notes(id, title, created_at)")
		.eq("id", entityId)
		.eq("user_id", userId)
		.single();

	// PGRST116: The query returned no rows. This is not an error in this case, it just means not found.
	if (error && error.code !== POSTGRES_ERROR_NOT_FOUND) {
		return handleSupabaseError(error);
	}

	if (!data) {
		return null;
	}

	// Ensure notes is always an array
	return {
		...data,
		notes: data.notes || [],
	};
};

export const updateEntity = async (
	supabase: SupabaseClient,
	userId: string,
	entityId: string,
	data: UpdateEntityCommand,
): Promise<EntityDTO> => {
	const UNIQUE_CONSTRAINT_VIOLATION_CODE = "23505";

	const { data: updatedEntity, error } = await supabase
		.from("entities")
		.update(data)
		.eq("id", entityId)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) {
		if (error.code === UNIQUE_CONSTRAINT_VIOLATION_CODE) {
			throw new Error(`An entity with the name "${data.name}" already exists.`);
		}
		if (error.code === POSTGRES_ERROR_NOT_FOUND) {
			throw new Error("Entity not found or user does not have permission to update it.");
		}
		return handleSupabaseError(error);
	}

	return updatedEntity;
};

export const deleteEntity = async (
	supabase: SupabaseClient,
	userId: string,
	entityId: string,
): Promise<{ success: boolean }> => {
	const { error, count } = await supabase
		.from("entities")
		.delete({ count: "exact" })
		.eq("id", entityId)
		.eq("user_id", userId);

	if (error) {
		return handleSupabaseError(error);
	}

	if (count === 0) {
		return { success: false };
	}

	return { success: true };
};
