import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createSafeApi } from './createSafeApi';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const querySchema = z.object({
  search: z.string().min(1),
});

const bodySchema = z.object({
  field: z.string(),
});

describe('createSafeApi', () => {
  it('should handle a valid request', async () => {
    const api = createSafeApi({}).params(paramsSchema).query(querySchema).body(bodySchema);

    const handler = api.handler((request, { params, query, body }) => {
      return new Response(JSON.stringify({ params, query, body }), { status: 200 });
    });

    const url = 'http://localhost/api?search=test';
    const request = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'value' }),
    });
    const context = {
      params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
    };

    const response = await handler(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.params).toEqual({ id: '123e4567-e89b-12d3-a456-426614174000' });
    expect(data.query).toEqual({ search: 'test' });
    expect(data.body).toEqual({ field: 'value' });
  });

  it('should return 400 for invalid params', async () => {
    const api = createSafeApi({}).params(paramsSchema).query(querySchema).body(bodySchema);

    const handler = api.handler((request, { params, query, body }) => {
      return new Response(JSON.stringify({ params, query, body }), { status: 200 });
    });

    const url = 'http://localhost/api?search=test';
    const request = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'value' }),
    });
    const context = {
      params: Promise.resolve({ id: 'not-a-valid-uuid' }),
    };

    const response = await handler(request, context);
    expect(response.status).toBe(400);
    const message = await response.text();
    expect(message).toContain('Invalid params');
  });

  it('should return 400 for invalid query', async () => {
    const api = createSafeApi({}).params(paramsSchema).query(querySchema).body(bodySchema);

    const handler = api.handler((request, { params, query, body }) => {
      return new Response(JSON.stringify({ params, query, body }), { status: 200 });
    });

    // Provide empty search which violates min(1)
    const url = 'http://localhost/api?search=';
    const request = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'value' }),
    });
    const context = {
      params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
    };

    const response = await handler(request, context);
    expect(response.status).toBe(400);
    const message = await response.text();
    expect(message).toContain('Invalid query');
  });

  it('should return 400 for invalid body', async () => {
    const api = createSafeApi({}).params(paramsSchema).query(querySchema).body(bodySchema);

    const handler = api.handler((request, { params, query, body }) => {
      return new Response(JSON.stringify({ params, query, body }), { status: 200 });
    });

    const url = 'http://localhost/api?search=test';
    // Missing required 'field'
    const request = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wrongField: 'value' }),
    });
    const context = {
      params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
    };

    const response = await handler(request, context);
    expect(response.status).toBe(400);
    const message = await response.text();
    expect(message).toContain('Invalid body');
  });

  it('should accumulate context from middleware', async () => {
    const additionalDataMiddleware = async ({
      request,
      context,
    }: {
      request: Request;
      context?: { middlewareData?: string };
    }) => {
      return { middlewareData: 'fromMiddleware' };
    };

    const api = createSafeApi({})
      .params(paramsSchema)
      .query(querySchema)
      .body(bodySchema)
      .use(additionalDataMiddleware);

    const handler = api.handler((request, { params, query, body, data }) => {
      return new Response(JSON.stringify({ params, query, body, data }), { status: 200 });
    });

    const url = 'http://localhost/api?search=middleware';
    const request = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'value' }),
    });
    const context = {
      params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
    };

    const response = await handler(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual({ middlewareData: 'fromMiddleware' });
  });

  it('should return 500 with default error message when no custom handler is provided', async () => {
    const api = createSafeApi({}).params(paramsSchema).query(querySchema).body(bodySchema);

    const handler = api.handler((request, { params, query, body }) => {
      throw new Error('Unexpected failure');
    });

    const url = 'http://localhost/api?search=failure';
    const request = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'value' }),
    });
    const context = {
      params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
    };

    const response = await handler(request, context);
    expect(response.status).toBe(500);
    const resBody = await response.json();
    expect(resBody.message).toBe('Internal server error');
  });
});
