import { apiSlice } from "./apiSlice";

export const recommendationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Backend exposes a generic /products/recommendations endpoint which uses the
    // authenticated user (from the token) to return personalized recs.
    // Keep the hook signature backward-compatible (accepts an optional userId)
    // but call the correct backend path.
    getRecommendations: builder.query({
      query: (_userId?: string) => ({ url: "/products/recommendations" }),
      providesTags: ["Recommendation"],
    }),
    getTrendingProducts: builder.query({
      query: (params = {}) => ({
        url: "/products/recommendations/trending",
        params,
      }),
      providesTags: ["Recommendation"],
    }),
    // Backend route: GET /products/recommendations/new-arrivals
    getNewArrivals: builder.query({
      query: (params = {}) => ({
        url: "/products/recommendations/new-arrivals",
        params,
      }),
      providesTags: ["Recommendation"],
    }),
    getUserBanners: builder.query({
      query: (userId: string) => `/recommendations/user-banners/${userId}`,
      providesTags: ["Banner"],
    }),
    // Backend provides a "customers who bought also bought" style endpoint
    // which expects a query param `product_id`. Map the frontend call to that
    // backend route so we don't get 404s.
    getRelatedProducts: builder.query({
      query: (params: { id?: string; limit?: number } = { limit: 5 }) => ({
        url: `/products/recommendations/customers-who-bought-also-bought`,
        params: { product_id: params.id, limit: params.limit || 5 },
      }),
    }),
    // Backend route for frequently-bought-together is: /products/fbt-recommendations/{product_id}
    getFBTProducts: builder.query({
      query: (params: { id?: string; limit?: number } = { limit: 5 }) => ({
        url: `/products/fbt-recommendations/${params.id}`,
        params: { limit: params.limit || 10 },
      }),
    }),
    getSimilarProducts: builder.query({
      query: (productId: string) => `/products/recommendations/similar/${productId}`,
    }),
    getCartRecommendations: builder.query({
      query: (userId: string) => `/products/recommendations/cart/${userId}`,
    }),
    getCollaborativeRecommendations: builder.query({
      query: (params: { userId: string; limit?: number }) => ({
        url: `/products/recommendations/collaborative/${params.userId}`,
        params: { limit: params.limit || 10 },
      }),
      providesTags: ["Recommendation"],
    }),

    getHybridRecommendations: builder.query({
      query: (params: {
        userId: string;
        limit?: number;
        product_context?: string;
      }) => ({
        url: `/products/recommendations/hybrid/${params.userId}`,
        params: {
          limit: params.limit || 10,
          product_context: params.product_context,
        },
      }),
      providesTags: ["Recommendation"],
    }),
  }),
});

export const {
  useGetRecommendationsQuery,
  useGetTrendingProductsQuery,
  useGetNewArrivalsQuery,
  useGetUserBannersQuery,
  useGetRelatedProductsQuery,
  useGetFBTProductsQuery,
  useGetSimilarProductsQuery,
  useGetCartRecommendationsQuery,
  useGetCollaborativeRecommendationsQuery,
  useGetHybridRecommendationsQuery,
} = recommendationApi;
