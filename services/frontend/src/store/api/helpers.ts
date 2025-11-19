/**
 * API Query Helpers
 * Utilities for building consistent API queries with RTK Query
 */

import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { PaginationParams, SortParams } from "../../types";
import type { ApiTagType } from "./apiSlice";

/**
 * Build query with pagination and sorting
 */
export const buildQuery = (
  url: string,
  params?: Record<string, unknown> | unknown
): FetchArgs => {
  const searchParams = new URLSearchParams();

  if (params && typeof params === 'object') {
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
  }

  const queryString = searchParams.toString();
  return {
    url: queryString ? `${url}?${queryString}` : url,
    method: "GET",
  };
};

/**
 * Build query with custom params (alias for buildQuery)
 */
export const buildQueryWithParams = buildQuery;

/**
 * Build paginated query
 */
export const buildPaginatedQuery = (
  url: string,
  pagination?: PaginationParams,
  filters?: Record<string, unknown>
): FetchArgs => {
  return buildQuery(url, { ...pagination, ...filters });
};

/**
 * Build sorted query
 */
export const buildSortedQuery = (
  url: string,
  sort?: SortParams,
  filters?: Record<string, unknown>
): FetchArgs => {
  return buildQuery(url, { ...sort, ...filters });
};

/**
 * Build query with pagination and sorting
 */
export const buildPaginatedSortedQuery = (
  url: string,
  pagination?: PaginationParams,
  sort?: SortParams,
  filters?: Record<string, unknown>
): FetchArgs => {
  return buildQuery(url, { ...pagination, ...sort, ...filters });
};

/**
 * Transform error response to user-friendly message
 */
export const transformErrorResponse = (error: unknown): string => {
  if (typeof error === "string") return error;

  if (error && typeof error === "object" && "data" in error) {
    const errorData = (error as { data: unknown }).data;

    if (
      errorData &&
      typeof errorData === "object" &&
      "detail" in errorData &&
      typeof (errorData as { detail: unknown }).detail === "string"
    ) {
      return (errorData as { detail: string }).detail;
    }

    if (
      errorData &&
      typeof errorData === "object" &&
      "message" in errorData &&
      typeof (errorData as { message: unknown }).message === "string"
    ) {
      return (errorData as { message: string }).message;
    }
  }

  return "An unexpected error occurred";
};

/**
 * Serialize query args for caching
 * Used in serializeQueryArgs to ensure consistent cache keys
 */
export const serializeQueryArgs = (args: Record<string, unknown>): string => {
  const sorted = Object.keys(args)
    .sort()
    .reduce((acc, key) => {
      acc[key] = args[key];
      return acc;
    }, {} as Record<string, unknown>);

  return JSON.stringify(sorted);
};

/**
 * Merge paginated results
 * Used for infinite scroll/load more functionality
 */
export const mergePaginatedResults = <T>(
  currentCache: { items: T[]; total: number; page: number; pages: number },
  newItems: { items: T[]; total: number; page: number; pages: number },
  otherArgs: { arg: { page?: number } }
): { items: T[]; total: number; page: number; pages: number } => {
  if (otherArgs.arg.page === 1) {
    // First page - replace cache
    return newItems;
  }

  // Subsequent pages - append to cache
  return {
    ...newItems,
    items: [...currentCache.items, ...newItems.items],
  };
};

/**
 * Provide tags for list endpoints
 * Enables automatic cache invalidation
 * Supports both arrays and paginated responses
 */
export const providesList = <T extends { id: string | number }>(
  resultsWithIds: T[] | { items: T[] } | undefined,
  tagType: ApiTagType
) => {
  // Handle paginated response
  const items = resultsWithIds && 'items' in resultsWithIds 
    ? resultsWithIds.items 
    : resultsWithIds as T[] | undefined;

  return items
    ? [
        { type: tagType, id: "LIST" as const },
        ...items.map(({ id }) => ({ type: tagType, id })),
      ]
    : [{ type: tagType, id: "LIST" as const }];
};

/**
 * Invalidate tags for list endpoints
 */
export const invalidatesList = (tagType: ApiTagType) => {
  return [{ type: tagType, id: "LIST" as const }];
};
