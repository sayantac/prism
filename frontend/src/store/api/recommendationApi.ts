import { apiSlice } from "./apiSlice";

export const recommendationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecommendations: builder.query({
      query: (userId: string) => `/recommendations/recommendations/${userId}`,
      providesTags: ["Recommendation"],
    }),
    getTrendingProducts: builder.query({
      query: (params = {}) => ({
        url: "/recommendations/trending",
        params,
      }),
      providesTags: ["Recommendation"],
    }),
    getNewArrivals: builder.query({
      query: (params = {}) => ({
        url: "/recommendations/new-arrivals",
        params,
      }),
      providesTags: ["Recommendation"],
    }),
    getUserBanners: builder.query({
      query: (userId: string) => `/recommendations/user-banners/${userId}`,
      providesTags: ["Banner"],
    }),
    getRelatedProducts: builder.query({
      query: (params: { id?: string; limit: number } = { limit: 5 }) => ({
        url: `/recommendations/product/${params.id}`,
        // params,
      }),
    }),
    getFBTProducts: builder.query({
      query: (params: { id?: string; limit: number } = { limit: 5 }) => ({
        url: `/recommendations/fbt/${params.id}`,
      }),
    }),
    getSimilarProducts: builder.query({
      query: (productId: string) => `/recommendations/similar/${productId}`,
    }),
    getCartRecommendations: builder.query({
      query: (userId: string) => `/recommendations/cart/${userId}`,
    }),
    getCollaborativeRecommendations: builder.query({
      query: (params: { userId: string; limit?: number }) => ({
        url: `/recommendations/collaborative/${params.userId}`,
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
        url: `/recommendations/hybrid/${params.userId}`,
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
