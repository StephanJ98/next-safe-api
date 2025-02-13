<h1 align="center">next-safe-api</h1>

A fork from [next-zod-route](https://github.com/Melvynx/next-zod-route) from fork from [next-safe-route](https://github.com/richardsolomou/next-safe-route) that uses [zod](https://github.com/colinhacks/zod) instead of [typeschema](https://github.com/typeschema/main), and now supports Next.js 15.

[![NPM](https://img.shields.io/npm/v/next-safe-api?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/next-safe-api)
[![Release](https://github.com/StephanJ98/next-safe-api/actions/workflows/release.yaml/badge.svg)](https://github.com/StephanJ98/next-safe-api/actions/workflows/release.yaml)
[![Test](https://github.com/StephanJ98/next-safe-api/actions/workflows/test.yaml/badge.svg)](https://github.com/StephanJ98/next-safe-api/actions/workflows/test.yaml)

`next-safe-api` is a utility library for Next.js 15 that provides type-safety and schema validation for [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)/API Routes.

## Features

- **✅ Schema Validation:** Automatically validates request parameters, query strings, and body content with built-in error handling.
- **🧷 Type-Safe:** Works with full TypeScript type safety for parameters, query strings, and body content.
- **😌 Easy to Use:** Simple and intuitive API that makes defining route handlers a breeze.
- **🔗 Extensible:** Compatible with any validation library supported by [TypeSchema](https://typeschema.com).
- **🧪 Fully Tested:** Extensive test suite to ensure everything works reliably.

## Installation

```sh
npm install next-safe-api
```

The library only works with [zod](https://zod.dev) for schema validation.

## Usage

```ts
// app/api/hello/route.ts
import { createSafeApi } from 'next-safe-api';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string(),
});

const querySchema = z.object({
  search: z.string().optional(),
});

const bodySchema = z.object({
  field: z.string(),
});

export const GET = createSafeApi()
  .params(paramsSchema)
  .query(querySchema)
  .body(bodySchema)
  .handler(async (request, context) => {
    const { id } = await context.params; // Since Next.js 15 the params are now a promise
    const { search } = context.query;
    const { field } = context.body;

    return Response.json({ id, search, field }), { status: 200 };
  });
```

To define a route handler in Next.js:

1. Import `createSafeApi` and your validation library (default, `zod`).
2. Define validation schemas for params, query, and body as needed.
3. Use `createSafeApi()` to create a route handler, chaining `params`, `query`, and `body` methods.
4. Implement your handler function, accessing validated and type-safe params, query, and body through `context`.

## Advanced Usage

### Middleware

You can add middleware to your route handler with the `use` method.

```ts
const safeRoute = createSafeApi()
  .use(async (request, context) => {
    return { user: { id: 'user-123', role: 'admin' } };
  })
  .handler((request, context) => {
    const user = context.data.user;
    return Response.json({ user }, { status: 200 });
  });
```

Ensure that the middleware returns an object. The returned object will be merged with the context object.

### Custom Error Handler

You can specify a custom error handler function with the `handleServerError` method.

To achieve this, define a custom error handler when creating the `safeRoute`:

- Create a custom error class that extends `Error` and a `safeRoute` instance with a custom error handler:

```ts
import { createSafeApi } from 'next-safe-api';
import { NextResponse } from 'next/server';

export class RouteError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RouteError';
    this.message = message;
    this.status = status || 400;
  }
}

export const saferoute = createSafeApi({
  handleServerError: (error: Error) => {
    if (error instanceof RouteError) return NextResponse.json({ message: error.message }, { status: error.status });

    return NextResponse.json({ message: 'Something went wrong' }, { status: 400 });
  },
});
```

- Use the `handleServerError` method to define a custom error handler.:

```ts
const GET = safeRoute.handler((request, context) => {
  // This error will be handled by the custom error handler with a 500 status code
  throw new RouteError('Test error', 500);
});
```

By default, to avoid any information leakage, the error handler will always return a generic error message.

## Tests

Tests are written using [Vitest](https://vitest.dev). To run the tests, use the following command:

```sh
pnpm test
```

## Contributing

Contributions are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
