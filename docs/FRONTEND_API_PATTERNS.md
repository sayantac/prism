# API Integration Patterns

This document outlines the best practices and patterns for API integration using RTK Query in this project.

## Overview

We use **RTK Query** (part of Redux Toolkit) for all API interactions. The architecture includes:

- **apiSlice.ts**: Base API configuration with interceptors
- **helpers.ts**: Reusable query building utilities
- **hooks.ts**: Type-safe Redux hooks
- **Individual API files**: Domain-specific endpoints (productApi, authApi, etc.)

## Core Features

### 1. Automatic Token Refresh

The `baseQueryWithInterceptors` automatically handles 401 errors and refreshes tokens:

```typescript
// Automatic retry with refreshed token
if (result.error?.status === 401) {
  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken) {
    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST", body: { refresh_token: refreshToken } },
      api,
      extraOptions
    );
    // Retry original request with new token
  }
}
```

### 2. Error Handling & User Feedback

All API errors are automatically:
- Transformed to user-friendly messages
- Displayed as toast notifications
- Logged for debugging

```typescript
transformErrorResponse, // Added to all endpoints
```

### 3. Cache Management

Optimized cache configuration:
- `keepUnusedDataFor: 60` - Cache data for 1 minute
- `refetchOnMountOrArgChange: 30` - Refetch if data is older than 30 seconds
- `refetchOnReconnect: true` - Refresh on network reconnect

## Query Builder Helpers

### buildQuery

Basic query builder with parameter serialization:

```typescript
import { buildQuery } from "@/store/api/helpers";

const endpoint = buildQuery("/products", { 
  category: "electronics",
  inStock: true 
});
// Returns: { url: "/products?category=electronics&inStock=true", method: "GET" }
```

### buildPaginatedQuery

For paginated endpoints:

```typescript
import { buildPaginatedQuery } from "@/store/api/helpers";

const endpoint = buildPaginatedQuery("/products", 
  { page: 2, page_size: 20 },
  { category: "electronics" }
);
```

### buildPaginatedSortedQuery

For endpoints with both pagination and sorting:

```typescript
import { buildPaginatedSortedQuery } from "@/store/api/helpers";

const endpoint = buildPaginatedSortedQuery(
  "/products",
  { page: 1, page_size: 20 },
  { sort_by: "price", sort_order: "asc" },
  { category: "electronics" }
);
```

## Cache Utilities

### providesList

Automatically generates cache tags for list responses:

```typescript
providesTags: (result) => providesList(result, "Product"),
// Generates: [{ type: 'Product', id: 'LIST' }, { type: 'Product', id: '1' }, ...]
```

### invalidatesList

Invalidates all items of a type:

```typescript
invalidatesTags: invalidatesList("Product"),
// Invalidates: [{ type: 'Product', id: 'LIST' }]
```

### mergePaginatedResults

For infinite scroll patterns:

```typescript
merge: mergePaginatedResults,
serializeQueryArgs, // Ignore page parameter for caching
```

## Example: Creating an API File

Here's a complete example following our patterns:

```typescript
import { apiSlice } from "./apiSlice";
import {
  buildPaginatedQuery,
  providesList,
  transformErrorResponse,
} from "./helpers";
import type { Product, PaginatedResponse, PaginationParams } from "@/types";

interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductListParams extends PaginationParams {
  filters?: ProductFilters;
}

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Query endpoint with pagination
    getProducts: builder.query<PaginatedResponse<Product>, ProductListParams>({
      query: (params) => buildPaginatedQuery("/products", params),
      providesTags: (result) => providesList(result, "Product"),
      transformErrorResponse,
    }),

    // Query endpoint without pagination
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
      transformErrorResponse,
    }),

    // Mutation endpoint
    createProduct: builder.mutation<Product, Partial<Product>>({
      query: (product) => ({
        url: "/products",
        method: "POST",
        body: product,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
      transformErrorResponse,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
} = productApi;

// Lazy query hooks for programmatic usage
export const {
  useLazyGetProductsQuery,
  useLazyGetProductByIdQuery,
} = productApi;
```

## Type Safety

### Using Typed Hooks

Always use our typed Redux hooks:

```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// Instead of:
// const dispatch = useDispatch();
// const user = useSelector(state => state.auth.user);

// Use:
const dispatch = useAppDispatch(); // Fully typed dispatch
const user = useAppSelector((state) => state.auth.user); // Fully typed state
```

### Query Parameters

Define clear interfaces for query parameters:

```typescript
interface ProductListParams extends PaginationParams {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

// TypeScript ensures all parameters are valid
useGetProductsQuery({ page: 1, category: "electronics" });
```

## Best Practices

### 1. Always Use Helpers

❌ **Don't:**
```typescript
query: (params) => ({
  url: `/products?page=${params.page}&size=${params.size}`,
  method: "GET",
})
```

✅ **Do:**
```typescript
query: (params) => buildPaginatedQuery("/products", params)
```

### 2. Define Response Types

❌ **Don't:**
```typescript
builder.query({
  query: (id) => `/products/${id}`,
})
```

✅ **Do:**
```typescript
builder.query<Product, string>({
  query: (id) => `/products/${id}`,
})
```

### 3. Add Cache Tags

❌ **Don't:**
```typescript
createProduct: builder.mutation({
  query: (product) => ({
    url: "/products",
    method: "POST",
    body: product,
  }),
})
```

✅ **Do:**
```typescript
createProduct: builder.mutation({
  query: (product) => ({
    url: "/products",
    method: "POST",
    body: product,
  }),
  invalidatesTags: [{ type: "Product", id: "LIST" }],
})
```

### 4. Always Transform Errors

Add `transformErrorResponse` to all endpoints:

```typescript
endpoints: (builder) => ({
  getProducts: builder.query({
    query: () => "/products",
    transformErrorResponse, // ✅ This ensures consistent error handling
  }),
})
```

## Common Patterns

### Infinite Scroll

```typescript
getProducts: builder.query<PaginatedResponse<Product>, ProductListParams>({
  query: (params) => buildPaginatedQuery("/products", params),
  serializeQueryArgs, // Ignore page for caching
  merge: mergePaginatedResults, // Append new items
  forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg,
}),
```

### Conditional Queries

```typescript
// Skip query if no ID
const { data, isLoading } = useGetProductByIdQuery(productId, {
  skip: !productId,
});
```

### Optimistic Updates

```typescript
updateProduct: builder.mutation<Product, { id: string; data: Partial<Product> }>({
  query: ({ id, data }) => ({
    url: `/products/${id}`,
    method: "PUT",
    body: data,
  }),
  async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
    // Optimistic update
    const patchResult = dispatch(
      productApi.util.updateQueryData("getProductById", id, (draft) => {
        Object.assign(draft, data);
      })
    );
    try {
      await queryFulfilled;
    } catch {
      patchResult.undo(); // Rollback on error
    }
  },
}),
```

### Polling

```typescript
const { data } = useGetProductsQuery(params, {
  pollingInterval: 30000, // Refresh every 30 seconds
});
```

## Debugging

### Enable RTK Query DevTools

RTK Query integrates with Redux DevTools automatically. Look for:
- `api/executeQuery` - Query execution
- `api/executeMutation` - Mutation execution
- Cache state under `api.queries` and `api.mutations`

### Common Issues

1. **Query not refetching**: Check cache configuration and tags
2. **Type errors**: Ensure all types are properly imported from `@/types`
3. **401 errors not handled**: Verify token refresh logic in `apiSlice.ts`
4. **Stale data**: Adjust `keepUnusedDataFor` or use `refetch()`

## Migration Guide

If you're updating an old API file:

1. Add proper TypeScript types to query/mutation
2. Replace manual URL building with `buildQuery` helpers
3. Add `transformErrorResponse` to all endpoints
4. Use `providesList` and `invalidatesList` for cache tags
5. Export lazy query hooks if needed

## Resources

- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Our Type Definitions](/src/types/README.md)
- [API Helpers Source](/src/store/api/helpers.ts)
