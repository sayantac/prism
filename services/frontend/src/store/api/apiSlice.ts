import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import toast from "react-hot-toast";
import env from "../../config/env";
import type { RootState } from "../store";
import { logout } from "../slices/authSlice";

const MULTIPART_ENDPOINTS = new Set([
  "generateProductContent",
  "uploadProductImage",
]);

/**
 * Base query with authentication headers
 */
const baseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = (getState() as RootState).auth.token;
    
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    
  const skipContentType = endpoint && MULTIPART_ENDPOINTS.has(endpoint);

    if (skipContentType && headers.has("Content-Type")) {
      headers.delete("Content-Type");
    }

    // Only set Content-Type if not already set (important for file uploads)
    if (!headers.has("Content-Type") && !skipContentType) {
      headers.set("Content-Type", "application/json");
    }
    
    return headers;
  },
  credentials: "include", // Send cookies with requests
});

/**
 * Enhanced base query with error handling and token refresh
 */
const baseQueryWithInterceptors: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized - token expired
  if (result.error && result.error.status === 401) {
    // Attempt to refresh token
    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Token refresh successful - retry original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Token refresh failed - logout user
      api.dispatch(logout());
      toast.error("Your session has expired. Please log in again.");
    }
  }

  // Handle other error statuses
  if (result.error) {
    const status = result.error.status;
    
    // Don't show toast for certain errors (handled by components)
    const silentErrors = [400, 404];
    
    if (!silentErrors.includes(status as number)) {
      handleApiError(result.error);
    }
  }

  return result;
};

/**
 * Handle API errors and show appropriate messages
 */
const handleApiError = (error: FetchBaseQueryError) => {
  if (typeof error.status === "number") {
    switch (error.status) {
      case 403:
        toast.error("You don't have permission to perform this action.");
        break;
      case 429:
        toast.error("Too many requests. Please try again later.");
        break;
      case 500:
        toast.error("Server error. Please try again later.");
        break;
      case 503:
        toast.error("Service temporarily unavailable. Please try again later.");
        break;
      default:
        if (error.status >= 500) {
          toast.error("An unexpected error occurred. Please try again.");
        }
    }
  } else if (error.status === "FETCH_ERROR") {
    toast.error("Network error. Please check your connection.");
  } else if (error.status === "TIMEOUT_ERROR") {
    toast.error("Request timeout. Please try again.");
  }
};

/**
 * Centralized cache tag types
 */
export const API_TAG_TYPES = [
  "User",
  "Product",
  "Category",
  "Cart",
  "Order",
  "Admin",
  "Analytics",
  "Recommendation",
  "Banner",
  "SystemSummary",
  "UserSegment",
  "BannerTemplates",
  "MLConfig",
  "ViewedProducts",
  "System",
  "BannerConfig",
  "BannerDashboard",
  "ArchivedBanners",
  "Banners",
  "SystemHealth",
  "CustomerSegments",
  "Review",
  "RecentlyViewed",
] as const;

export type ApiTagType = typeof API_TAG_TYPES[number];

/**
 * Main API slice with all tag types
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithInterceptors,
  
  tagTypes: API_TAG_TYPES as unknown as string[],
  
  // Keep unused data in cache for 60 seconds
  keepUnusedDataFor: 60,
  
  // Refetch on mount or arg change by default
  refetchOnMountOrArgChange: 30,
  
  // Refetch on reconnect
  refetchOnReconnect: true,
  
  endpoints: () => ({}),
});
