import type { Category } from "@/types";
import { apiSlice } from "./apiSlice";

type ProductContentMode = "description" | "title" | "seo" | "all";

interface GenerateProductContentArgs {
  mode: ProductContentMode;
  product: {
    name?: string;
    brand?: string;
    sku?: string;
    category?: string;
    context?: string;
    language?: string;
  };
  files?: File[];
}

interface FileUploadResponse {
  filename: string;
  url: string;
  size: number;
  content_type: string;
}

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard
    // Dashboard Overview - Quick stats for initial page load
    getDashboardOverview: builder.query({
      query: () => "/admin/analytics/dashboard/overview",
      providesTags: ["Analytics"],
      keepUnusedDataFor: 60, // 1 minute for quick stats
    }),
    // Comprehensive Dashboard - Full metrics with date range
    getAdminDashboard: builder.query({
      query: (params = { days: 30 }) => ({
        url: "/admin/analytics/dashboard",
        params,
      }),
      transformResponse: (response: any) => {
        // Transform API response to match component expectations
        return {
          ...response,
          revenue: {
            total: response.orders?.total_revenue || 0,
            trend: response.orders?.daily_trend || [],
          },
          orders: {
            total: response.orders?.total_orders || 0,
            average: response.orders?.average_order_value || 0,
            status: response.orders?.status_breakdown || {},
            trend: response.orders?.daily_trend || [],
          },
          users: {
            active: response.users?.active_users || 0,
            new: response.users?.new_users || 0,
            retention: response.users?.retention_rate || 0,
          },
          products: response.products || {},
          search: response.search || {},
          recommendations: response.recommendations || {},
          period: response.period || {},
        };
      },
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getSystemStatus: builder.query({
      query: () => "/admin/system/status",
      providesTags: ["System"],
      keepUnusedDataFor: 60, // 1 minute
    }),
    // Additional Dashboard Endpoints
    getRealTimeStats: builder.query({
      query: () => "/admin/dashboard/real-time-stats",
      providesTags: ["Dashboard"],
      keepUnusedDataFor: 30, // 30 seconds for real-time data
    }),
    getSystemHealth: builder.query({
      query: () => "/admin/dashboard/system-health",
      providesTags: ["System"],
      keepUnusedDataFor: 60, // 1 minute
    }),
    getQuickStats: builder.query({
      query: () => "/admin/dashboard/quick-stats",
      providesTags: ["Dashboard"],
      keepUnusedDataFor: 60, // 1 minute
    }),
    getPerformanceMetrics: builder.query({
      query: () => "/admin/dashboard/performance-metrics",
      providesTags: ["System"],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getRecentActivity: builder.query({
      query: (params = { limit: 50, hours: 24 }) => ({
        url: "/admin/dashboard/recent-activity",
        params,
      }),
      providesTags: ["Activity"],
      keepUnusedDataFor: 60, // 1 minute
    }),

    // Products Management
    getProductCategories: builder.query<Category[], void>({
      query: () => "/admin/products/categories",
      providesTags: ["Category"],
    }),
    getAdminProducts: builder.query({
      query: (params = {}) => ({
        url: "/admin/products/products",
        params,
      }),
      providesTags: ["Product"],
    }),
    uploadProductImage: builder.mutation<FileUploadResponse, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/products/upload-image",
          method: "POST",
          body: formData,
        };
      },
    }),
    createProduct: builder.mutation({
      query: (productData) => ({
        url: "/admin/products/products",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/products/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/admin/products/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    generateProductContent: builder.mutation({
      query: ({ mode, product, files }: GenerateProductContentArgs) => {
        const formData = new FormData();
        formData.append("mode", mode);
        formData.append("product_name", product.name ?? "");
        formData.append("brand", product.brand ?? "");
        formData.append("sku", product.sku ?? "");
        formData.append("category", product.category ?? "");
        formData.append("context", product.context ?? "");
        formData.append("language", product.language ?? "English");

        files?.forEach((file) => {
          formData.append("files", file);
        });

        return {
          url: "/products/description-ai/generate-product-content",
          method: "POST",
          body: formData,
        };
      },
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
      query: (params = { days: 30 }) => ({
        url: "/admin/analytics/kpis",
        params,
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300,
    }),
    getRecommendationPerformance: builder.query({
      query: (params = { algorithm: undefined, days: 30 }) => ({
        url: "/admin/analytics/recommendations/performance",
        params,
      }),
      providesTags: ["Recommendation", "Analytics"],
      keepUnusedDataFor: 180,
    }),
    getSegmentPerformance: builder.query({
      query: () => "/admin/user-segmentation/segments/analytics",
      providesTags: ["UserSegment", "Analytics"],
      keepUnusedDataFor: 600,
      transformResponse: (response: any) => {
        // Backend returns array directly, ensure it's always an array
        return Array.isArray(response) ? response : [];
      },
    }),
    getRevenueData: builder.query({
      query: (params: any = {}) => ({
        url: "/admin/analytics/revenue",
        params: {
          start_date: params.startDate,
          end_date: params.endDate,
          granularity: params.granularity || "daily",
        },
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300,
    }),
    getUserActivityData: builder.query({
      query: (params = { days: 90 }) => ({
        url: "/admin/analytics/user-activity",
        params,
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300,
    }),
    getSearchAnalytics: builder.query({
      query: (params = { days: 90 }) => ({
        url: "/admin/analytics/search",
        params,
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300,
    }),
    getTopProducts: builder.query({
      query: (params = { days: 90, limit: 10 }) => ({
        url: "/admin/analytics/top-products",
        params,
      }),
      providesTags: ["Analytics", "Product"],
      keepUnusedDataFor: 300,
    }),
    getRealTimeMetrics: builder.query({
      query: () => "/admin/analytics/realtime",
      providesTags: ["Analytics"],
      keepUnusedDataFor: 30,
    }),
    // Additional Analytics Endpoints
    getUserBehaviorSummary: builder.query({
      query: (params = { days: 30 }) => ({
        url: "/admin/analytics/user-behavior/summary",
        params,
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    // ML & AI Features
    getMlConfigs: builder.query({
      query: () => "/admin/ml-models/ml-config/",
      providesTags: ["MLConfig"],
    }),
    createMlConfig: builder.mutation({
      query: (configData) => ({
        url: "/admin/ml-models/ml-config/",
        method: "POST",
        body: configData,
      }),
      invalidatesTags: ["MLConfig"],
    }),
    updateMlConfig: builder.mutation({
      query: ({ id, ...configData }) => ({
        url: `/admin/ml-models/ml-config/${id}`,
        method: "PUT",
        body: configData,
      }),
      invalidatesTags: ["MLConfig"],
    }),
    activateMlConfig: builder.mutation({
      query: (configId) => ({
        url: `/admin/ml-models/ml-config/${configId}/activate`,
        method: "POST",
      }),
      invalidatesTags: ["MLConfig"],
    }),
    getModelPerformance: builder.query({
      query: ({ configId }) => `/admin/ml-models/ml-config/${configId}/performance`,
      providesTags: ["MLConfig"],
    }),
    trainModels: builder.mutation({
      query: (trainingData) => ({
        url: "/admin/ml-models/ml-config/train",
        method: "POST",
        body: trainingData,
      }),
      invalidatesTags: ["MLConfig"],
    }),

    // User Segmentation
    getUserSegments: builder.query({
      query: () => "/admin/user-segmentation/segments",
      providesTags: ["UserSegment"],
      keepUnusedDataFor: 600,
    }),
    createUserSegment: builder.mutation({
      query: (segmentData) => ({
        url: "/admin/user-segmentation/segments",
        method: "POST",
        body: segmentData,
      }),
      invalidatesTags: ["UserSegment"],
    }),
    updateUserSegment: builder.mutation({
      query: ({ segmentId, segment }) => ({
        url: `/admin/user-segmentation/segments/${segmentId}`,
        method: "PUT",
        body: segment,
      }),
      invalidatesTags: ["UserSegment"],
    }),
    deleteUserSegment: builder.mutation({
      query: (segmentId) => ({
        url: `/admin/user-segmentation/segments/${segmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserSegment"],
    }),
    recalculateSegment: builder.mutation({
      query: ({ segmentId }) => ({
        url: `/admin/user-segmentation/segments/${segmentId}/recalculate`,
        method: "POST",
      }),
      invalidatesTags: ["UserSegment"],
    }),
    getSegmentUsers: builder.query({
      query: ({ segmentId, limit = 100, offset = 0 }) => ({
        url: `/admin/user-segmentation/segments/${segmentId}/users`,
        params: { limit, offset },
      }),
      providesTags: ["UserSegment"],
    }),
    addUserToSegment: builder.mutation({
      query: ({ segmentId, userId }) => ({
        url: `/admin/user-segmentation/segments/${segmentId}/users/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["UserSegment"],
    }),
    removeUserFromSegment: builder.mutation({
      query: ({ segmentId, userId }) => ({
        url: `/admin/user-segmentation/segments/${segmentId}/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserSegment"],
    }),
    generateRfmSegments: builder.mutation({
      query: (params = { n_clusters: 5, lookback_days: 365 }) => ({
        url: "/admin/user-segmentation/segments/generate-rfm",
        method: "POST",
        body: params,
      }),
      invalidatesTags: ["UserSegment"],
    }),
  }),
});

export const {
  // Dashboard
  useGetDashboardOverviewQuery,
  useGetAdminDashboardQuery,
  useGetSystemStatusQuery,
  // useGetSystemConfigQuery,
  useGetRealTimeStatsQuery,
  useGetSystemHealthQuery,
  useGetQuickStatsQuery,
  useGetPerformanceMetricsQuery,
  useGetRecentActivityQuery,

  // Products
  useGetProductCategoriesQuery,
  useGetAdminProductsQuery,
  useUploadProductImageMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGenerateProductContentMutation,

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
  useGetRevenueDataQuery,
  useGetUserActivityDataQuery,
  useGetSearchAnalyticsQuery,
  useGetTopProductsQuery,
  useGetRealTimeMetricsQuery,
  useGetUserBehaviorSummaryQuery,

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
  useDeleteUserSegmentMutation,
  useRecalculateSegmentMutation,
  useGetSegmentUsersQuery,
  useAddUserToSegmentMutation,
  useRemoveUserFromSegmentMutation,
  useGenerateRfmSegmentsMutation,
} = adminApi;
