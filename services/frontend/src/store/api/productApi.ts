import { apiSlice } from "./apiSlice";
import {
  buildPaginatedQuery,
  buildQueryWithParams,
  serializeQueryArgs,
  mergePaginatedResults,
  providesList,
  transformErrorResponse,
} from "./helpers";
import type {
  Product,
  Category,
  ProductReview,
  ProductFilters,
  PaginatedResponse,
  SearchResponse,
} from "@/types";
import type { PaginationParams } from "@/types/common";

// Request/Response types
interface ProductListParams extends PaginationParams {
  filters?: ProductFilters;
}

interface SearchParams extends PaginationParams {
  q: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  brand?: string;
  sort?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  use_vector_search?: boolean;
  session_id?: string;
  size?: number;
  page_size?: number;
}

interface ReviewRequest {
  productId: string;
  rating: number;
  comment: string;
  title?: string;
}

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get paginated products with optional filters
    getProducts: builder.query<PaginatedResponse<Product>, ProductListParams>({
      query: (params) => buildPaginatedQuery("/products", params),
      providesTags: (result) => providesList(result, "Product"),
      serializeQueryArgs,
      merge: mergePaginatedResults,
      forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg,
      transformErrorResponse,
    }),

    // Get single product by ID
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
      transformErrorResponse,
    }),

    // Get all categories
    getCategories: builder.query<Category[], void>({
      query: () => "/products/categories",
      providesTags: ["Category"],
      transformErrorResponse,
    }),

    // Search products with filters (Advanced search endpoint)
    searchProducts: builder.query<PaginatedResponse<Product>, SearchParams>({
      query: (params) => {
        const {
          page = 1,
          limit,
          size,
          page_size,
          sort,
          sort_by,
          sort_order,
          use_vector_search,
          ...filters
        } = params;

        const finalSize = size ?? page_size ?? limit ?? 20;
        const finalSortBy = sort_by ?? (typeof sort === "string" && sort ? sort : undefined) ?? "relevance";
        const finalSortOrder = sort_order ?? "desc";

        const queryParams = {
          ...filters,
          page,
          size: finalSize,
          sort_by: finalSortBy,
          sort_order: finalSortOrder,
          use_vector_search: use_vector_search ?? true,
        };

        return buildQueryWithParams("/products/search", queryParams);
      },
      transformResponse: (response: SearchResponse<Product>): PaginatedResponse<Product> => ({
        items: response.products || [],
        total: response.total_count || response.total || 0,
        page: response.page || 1,
        pages: response.total_pages || response.pages || 1,
        limit: response.page_size || response.size || 20,
      }),
      providesTags: (result) => providesList(result, "Product"),
      transformErrorResponse,
    }),

    // Get reviews for a product
    getProductReviews: builder.query<
      PaginatedResponse<ProductReview>,
      { productId: string } & PaginationParams
    >({
      query: ({ productId, ...params }) =>
        buildPaginatedQuery(`/products/${productId}/reviews`, params),
      providesTags: (result, _error, { productId }) => [
        ...(result?.items?.map((review) => ({
          type: "Review" as const,
          id: review.id,
        })) ?? []),
        { type: "Review", id: `PRODUCT-${productId}` },
      ],
      transformErrorResponse,
    }),

    // Add review to a product
    addProductReview: builder.mutation<ProductReview, ReviewRequest>({
      query: ({ productId, ...review }) => ({
        url: `/products/${productId}/reviews`,
        method: "POST",
        body: review,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Review", id: `PRODUCT-${productId}` },
        { type: "Product", id: productId },
      ],
      transformErrorResponse,
    }),

    // Track product view (for recommendations)
    addToRecentlyViewed: builder.mutation<void, string>({
      query: (productId) => ({
        url: `/products/${productId}/view`,
        method: "POST",
      }),
      invalidatesTags: ["RecentlyViewed"],
      transformErrorResponse,
    }),

    // Get recently viewed products
    getRecentlyViewed: builder.query<Product[], void>({
      query: () => "/products/recently-viewed",
      providesTags: ["RecentlyViewed"],
      transformErrorResponse,
    }),

    // NOTE: getRelatedProducts has been moved to recommendationApi.ts
    // to use the correct backend endpoint (/products/recommendations/customers-who-bought-also-bought)
    // If you need related products, import useGetRelatedProductsQuery from recommendationApi

    // Get trending products
    getTrendingProducts: builder.query<Product[], { limit?: number }>({
      query: ({ limit = 10 }) => `/products/trending?limit=${limit}`,
      providesTags: ["Product"],
      transformErrorResponse,
    }),
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useSearchProductsQuery,
  useGetProductReviewsQuery,
  useAddProductReviewMutation,
  useAddToRecentlyViewedMutation,
  useGetRecentlyViewedQuery,
  // useGetRelatedProductsQuery is now in recommendationApi.ts
  useGetTrendingProductsQuery,
} = productApi;

// Export lazy query hooks for programmatic usage
export const {
  useLazyGetProductsQuery,
  useLazySearchProductsQuery,
  useLazyGetProductByIdQuery,
} = productApi;
