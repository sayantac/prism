/* eslint-disable @typescript-eslint/no-unused-vars */
import { apiSlice } from "./apiSlice";

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params = {}) => ({
        url: "/products",
        params,
      }),
      providesTags: ["Product"],
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, ...otherArgs } = queryArgs;
        return otherArgs;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          currentCache.items = newItems.items;
        } else {
          currentCache.items.push(...newItems.items);
        }
        currentCache.total = newItems.total;
        currentCache.page = newItems.page;
        currentCache.pages = newItems.pages;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg !== previousArg;
      },
    }),
    getProductById: builder.query({
      query: (id: string) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    getCategories: builder.query({
      query: () => "/products/categories",
      providesTags: ["Category"],
    }),
    searchProducts: builder.query({
      query: (params) => ({
        url: "/search/",
        params,
      }),
      providesTags: ["Product"],
    }),
    getProductReviews: builder.query({
      query: (productId: string) => `/products/${productId}/reviews`,
    }),
    addProductReview: builder.mutation({
      query: ({ productId, ...review }) => ({
        url: `/products/${productId}/reviews`,
        method: "POST",
        body: review,
      }),
    }),
    addToRecentlyViewed: builder.mutation({
      query: (productId: string) => ({
        url: `/products/${productId}/view`,
        method: "POST",
      }),
    }),
    getRecentlyViewed: builder.query({
      query: () => "/products/recently-viewed",
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useSearchProductsQuery,
  useGetProductReviewsQuery,
  useAddProductReviewMutation,
  useAddToRecentlyViewedMutation,
  useGetRecentlyViewedQuery,
} = productApi;
