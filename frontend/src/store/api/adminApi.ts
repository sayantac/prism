import { apiSlice } from "./apiSlice";

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard
    getAdminDashboard: builder.query({
      query: (params = { days: 90 }) => ({
        url: "/admin/analytics/dashboard",
        params,
      }),
      providesTags: ["Analytics"],
    }),
    getSystemStatus: builder.query({
      query: () => "/admin/system/status",
      providesTags: ["System"],
    }),
    getSystemConfig: builder.query({
      query: () => "/admin/system/config",
      providesTags: ["System"],
    }),

    // Products Management
    getAdminProducts: builder.query({
      query: (params = {}) => ({
        url: "/admin/products",
        params,
      }),
      providesTags: ["Product"],
    }),
    createProduct: builder.mutation({
      query: (productData) => ({
        url: "/admin/products",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),

    // Users Management
    getAdminUsers: builder.query({
      query: (params = { page: 1, page_size: 20 }) => ({
        url: "/admin/users",
        params,
      }),
      providesTags: ["User"],
    }),
    createUser: builder.mutation({
      query: (userData) => ({
        url: "/admin/users",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/users/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    assignRole: builder.mutation({
      query: ({ userId, roleId }) => ({
        url: `/admin/users/${userId}/roles/${roleId}`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    removeRole: builder.mutation({
      query: ({ userId, roleId }) => ({
        url: `/admin/users/${userId}/roles/${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // Orders Management
    getAdminOrders: builder.query({
      query: (params = { page: 1, page_size: 20 }) => ({
        url: "/admin/orders",
        params,
      }),
      providesTags: ["Order"],
    }),
    getOrderDetails: builder.query({
      query: (orderId) => `/admin/orders/${orderId}`,
      providesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status, admin_notes }) => ({
        url: `/admin/orders/${orderId}/status`,
        method: "PUT",
        body: { status, admin_notes },
      }),
      invalidatesTags: ["Order"],
    }),

    // Analytics
    getKpis: builder.query({
      query: (params = { days: 90 }) => ({
        url: "/admin/analytics/kpis",
        params,
      }),
      providesTags: ["Analytics"],
    }),
    getRecommendationPerformance: builder.query({
      query: (params = { days: 90 }) => ({
        url: "/admin/analytics/recommendations/performance",
        params,
      }),
      providesTags: ["Analytics"],
    }),
    getSegmentPerformance: builder.query({
      query: () => "/admin/analytics/segments/performance",
      providesTags: ["Analytics"],
    }),

    // ML & AI Features
    getMlConfigs: builder.query({
      query: () => "/admin/ml-config",
      providesTags: ["MLConfig"],
    }),
    createMlConfig: builder.mutation({
      query: (configData) => ({
        url: "/admin/ml-config",
        method: "POST",
        body: configData,
      }),
      invalidatesTags: ["MLConfig"],
    }),
    updateMlConfig: builder.mutation({
      query: ({ id, ...configData }) => ({
        url: `/admin/ml-config/${id}`,
        method: "PUT",
        body: configData,
      }),
      invalidatesTags: ["MLConfig"],
    }),
    activateMlConfig: builder.mutation({
      query: (configId) => ({
        url: `/admin/ml-config/${configId}/activate`,
        method: "POST",
      }),
      invalidatesTags: ["MLConfig"],
    }),
    getModelPerformance: builder.query({
      query: (configId) => `/admin/ml-config/${configId}/performance`,
      providesTags: ["MLConfig"],
    }),
    trainModels: builder.mutation({
      query: (trainingData) => ({
        url: "/admin/ml-config/train",
        method: "POST",
        body: trainingData,
      }),
      invalidatesTags: ["MLConfig"],
    }),

    // User Segmentation
    getUserSegments: builder.query({
      query: () => "/admin/segmentation/",
      providesTags: ["UserSegment"],
    }),
    createUserSegment: builder.mutation({
      query: (segmentData) => ({
        url: "/admin/segmentation",
        method: "POST",
        body: segmentData,
      }),
      invalidatesTags: ["UserSegment"],
    }),
    updateUserSegment: builder.mutation({
      query: ({ segmentId, ...segmentData }) => ({
        url: `/admin/segmentation/${segmentId}`,
        method: "PUT",
        body: segmentData,
      }),
      invalidatesTags: ["UserSegment"],
    }),
    recalculateSegment: builder.mutation({
      query: (segmentId) => ({
        url: `/admin/segmentation/${segmentId}/recalculate`,
        method: "POST",
      }),
      invalidatesTags: ["UserSegment"],
    }),
    recalculateAllSegments: builder.mutation({
      query: () => ({
        url: "/admin/segmentation/recalculate-all",
        method: "POST",
      }),
      invalidatesTags: ["UserSegment"],
    }),
  }),
});

export const {
  // Dashboard
  useGetAdminDashboardQuery,
  useGetSystemStatusQuery,
  useGetSystemConfigQuery,

  // Products
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,

  // Users
  useGetAdminUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useAssignRoleMutation,
  useRemoveRoleMutation,

  // Orders
  useGetAdminOrdersQuery,
  useGetOrderDetailsQuery,
  useUpdateOrderStatusMutation,

  // Analytics
  useGetKpisQuery,
  useGetRecommendationPerformanceQuery,
  useGetSegmentPerformanceQuery,

  // ML & AI
  useGetMlConfigsQuery,
  useCreateMlConfigMutation,
  useUpdateMlConfigMutation,
  useActivateMlConfigMutation,
  useGetModelPerformanceQuery,
  useTrainModelsMutation,

  // User Segmentation
  useGetUserSegmentsQuery,
  useCreateUserSegmentMutation,
  useUpdateUserSegmentMutation,
  useRecalculateSegmentMutation,
  useRecalculateAllSegmentsMutation,
} = adminApi;
