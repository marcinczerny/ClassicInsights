import {
  deleteEntity,
  getEntityById,
  updateEntity,
} from '@/lib/services/entities.service';
import { entitySchema } from '@/lib/validation';
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const GET: APIRoute = async ({ params, locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const entityId = params.id;
  if (!entityId) {
    return new Response(JSON.stringify({ error: 'Entity ID is required' }), { status: 400 });
  }

  try {
    const entity = await getEntityById(user.id, entityId);
    if (!entity) {
      return new Response(JSON.stringify({ error: 'Entity not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(entity), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const entityId = params.id;
  if (!entityId) {
    return new Response(JSON.stringify({ error: 'Entity ID is required' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const validatedData = entitySchema.partial().parse(body);

    const updatedEntity = await updateEntity(user.id, entityId, validatedData);

    return new Response(JSON.stringify(updatedEntity), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), {
        status: 400,
      });
    }
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const entityId = params.id;
  if (!entityId) {
    return new Response(JSON.stringify({ error: 'Entity ID is required' }), { status: 400 });
  }

  try {
    const result = await deleteEntity(user.id, entityId);
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Entity not found' }), { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
