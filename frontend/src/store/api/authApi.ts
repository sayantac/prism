import { apiSlice } from "./apiSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => {
        return {
          url: "/auth/login",
          method: "POST",
          body: credentials,
          headers: {
            "Content-Type": "application/json",
          },
        };
      },
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
    checkUsername: builder.mutation({
      query: (username: string) => ({
        url: `/auth/check-username?username=${username}`,
        method: "POST",
      }),
    }),
    getCurrentUser: builder.query({
      query: () => "/users/profile",
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/users/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    updateUsername: builder.mutation({
      query: (data: { username: string }) => ({
        url: "/users/username",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    updateAddress: builder.mutation({
      query: (data) => ({
        url: "/users/address",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    // Additional endpoints from the documentation
    updatePreferences: builder.mutation({
      query: (data) => ({
        url: "/users/preferences",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    getViewedProducts: builder.query({
      query: (limit = 20) => `/users/viewed-products?limit=${limit}`,
      providesTags: ["ViewedProducts"],
    }),
    addViewedProduct: builder.mutation({
      query: (productId: string) => ({
        url: `/users/viewed-products/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["ViewedProducts"],
    }),
    clearViewedProducts: builder.mutation({
      query: () => ({
        url: "/users/viewed-products",
        method: "DELETE",
      }),
      invalidatesTags: ["ViewedProducts"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useCheckUsernameMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useUpdateUsernameMutation,
  useUpdateAddressMutation,
  useUpdatePreferencesMutation,
  useGetViewedProductsQuery,
  useAddViewedProductMutation,
  useClearViewedProductsMutation,
} = authApi;
