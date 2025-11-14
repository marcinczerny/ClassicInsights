import { handleSupabaseError, type SupabaseClient } from "@/db/supabase.client";
import type { EntityWithCountDTO } from "@/types";
import type { CreateEntityCommand, EntityDTO } from "@/types";
import type { EntityWithNotesDTO, UpdateEntityCommand } from "@/types";

export const getEntities = async (supabase: SupabaseClient, userId: string): Promise<EntityWithCountDTO[]> => {
  const { data, error } = await supabase
    .from("entities")
    .select("*, note_entities(count)")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    handleSupabaseError(error);
  }

  return (
    data?.map((entity) => ({
      ...entity,
      note_count: Array.isArray(entity.note_entities) ? (entity.note_entities[0]?.count ?? 0) : 0,
    })) || []
  );
};

export const findEntityByName = async (supabase: SupabaseClient, userId: string, name: string): Promise<EntityDTO | null> => {
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("user_id", userId)
    .eq("name", name)
    .maybeSingle();

  if (error) {
    handleSupabaseError(error);
  }

  return data;
};

export const createEntity = async (supabase: SupabaseClient, userId: string, data: CreateEntityCommand): Promise<EntityDTO> => {
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

  const UNIQUE_CONSTRAINT_VIOLATION_CODE = "23505";
  if (error) {
    if (error.code === UNIQUE_CONSTRAINT_VIOLATION_CODE) {
      throw new Error(`An entity with the name "${name}" already exists.`);
    }
    handleSupabaseError(error);
  }

  if (!newEntity) {
    throw new Error("Failed to create entity.");
  }

  return newEntity;
};

const POSTGRES_ERROR_NOT_FOUND = "PGRST116";

export const getEntityById = async (supabase: SupabaseClient, userId: string, entityId: string): Promise<EntityWithNotesDTO | null> => {
  const { data, error } = await supabase
    .from("entities")
    .select(
      `
			*,
			note_entities(
				type,
				created_at,
				notes(id, title, created_at)
			)
		`
    )
    .eq("id", entityId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== POSTGRES_ERROR_NOT_FOUND) {
    handleSupabaseError(error);
  }

  if (!data) {
    return null;
  }

  const transformedData = {
    ...data,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notes: (data.note_entities || []).map((ne: any) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(ne as any).notes,
      relationship_type: ne.type,
    })),
    note_entities: undefined,
  };

  return transformedData;
};

export const updateEntity = async (supabase: SupabaseClient, userId: string, entityId: string, data: UpdateEntityCommand): Promise<EntityDTO> => {
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
    handleSupabaseError(error);
  }

  return updatedEntity;
};

export const deleteEntity = async (supabase: SupabaseClient, userId: string, entityId: string): Promise<{ success: boolean }> => {
  const { error, count } = await supabase
    .from("entities")
    .delete({ count: "exact" })
    .eq("id", entityId)
    .eq("user_id", userId);

  if (error) {
    handleSupabaseError(error);
  }

  if (count === 0) {
    return { success: false };
  }

  return { success: true };
};
