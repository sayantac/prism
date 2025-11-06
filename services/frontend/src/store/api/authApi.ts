import { apiSlice } from "./apiSlice";
import { transformErrorResponse } from "./helpers";
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  Address,
  UserPreferences,
  Product,
} from "@/types";

// Request types
interface UpdateProfileRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

interface UpdateUsernameRequest {
  username: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Login with credentials
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["User"],
      transformErrorResponse,
    }),

    // Register new user
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      transformErrorResponse,
    }),

    // Check if username is available
    checkUsername: builder.mutation<{ available: boolean }, string>({
      query: (username) => ({
        url: `/auth/check-username?username=${username}`,
        method: "POST",
      }),
      transformErrorResponse,
    }),

    // Get current user profile
    getCurrentUser: builder.query<User, void>({
      query: () => "/users/profile",
      providesTags: ["User"],
      transformErrorResponse,
    }),

    // Update user profile
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (data) => ({
        url: "/users/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
      transformErrorResponse,
    }),

    // Update username
    updateUsername: builder.mutation<User, UpdateUsernameRequest>({
      query: (data) => ({
        url: "/users/username",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
      transformErrorResponse,
    }),

    // Update delivery address
    updateAddress: builder.mutation<Address, Partial<Address>>({
      query: (data) => ({
        url: "/users/address",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
      transformErrorResponse,
    }),

    // Update user preferences
    updatePreferences: builder.mutation<
      UserPreferences,
      Partial<UserPreferences>
    >({
      query: (data) => ({
        url: "/users/preferences",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
      transformErrorResponse,
    }),

    // Get viewed products history
    getViewedProducts: builder.query<Product[], number | void>({
      query: (limit = 20) => `/users/viewed-products?limit=${limit}`,
      providesTags: ["ViewedProducts"],
      transformErrorResponse,
    }),

    // Track product view
    addViewedProduct: builder.mutation<void, string>({
      query: (productId) => ({
        url: `/users/viewed-products/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["ViewedProducts"],
      transformErrorResponse,
    }),

    // Clear viewed products history
    clearViewedProducts: builder.mutation<void, void>({
      query: () => ({
        url: "/users/viewed-products",
        method: "DELETE",
      }),
      invalidatesTags: ["ViewedProducts"],
      transformErrorResponse,
    }),

    // Refresh access token
    refreshToken: builder.mutation<{ access_token: string }, string>({
      query: (refreshToken) => ({
        url: "/auth/refresh",
        method: "POST",
        body: { refresh_token: refreshToken },
      }),
      transformErrorResponse,
    }),

    // Logout (clear server-side session if any)
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
      transformErrorResponse,
    }),
  }),
  overrideExisting: false,
});

// Export hooks
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
  useRefreshTokenMutation,
  useLogoutMutation,
} = authApi;

// Export lazy query hooks
export const { useLazyGetCurrentUserQuery, useLazyGetViewedProductsQuery } =
  authApi;
