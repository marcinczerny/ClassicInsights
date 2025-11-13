import type {
  CreateEntityCommand,
  EntitiesListResponseDTO,
  EntityDTO,
  EntityWithCountDTO,
  UpdateEntityCommand,
} from "@/types";

import type { EntitiesSortColumn, SortOrder } from "@/components/entities/types";

interface EntitiesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  sort?: EntitiesSortColumn;
  order?: SortOrder;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const errorBody = await response.json();
      throw new Error(errorBody?.message ?? "Request failed");
    }

    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchEntities(
  params: EntitiesQueryParams = {},
  signal?: AbortSignal
): Promise<EntityWithCountDTO[]> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });

  const url = `/api/entities${searchParams.size ? `?${searchParams.toString()}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  return handleResponse<EntityWithCountDTO[]>(response);
}

export async function createEntityRequest(payload: CreateEntityCommand): Promise<EntityDTO> {
  const response = await fetch("/api/entities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<EntityDTO>(response);
}

export async function updateEntityRequest(entityId: string, payload: UpdateEntityCommand): Promise<EntityDTO> {
  const response = await fetch(`/api/entities/${entityId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<EntityDTO>(response);
}

export async function deleteEntityRequest(entityId: string): Promise<void> {
  const response = await fetch(`/api/entities/${entityId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  await handleResponse<void>(response);
}
