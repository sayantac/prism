import { apiSlice } from "./apiSlice";

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard
    getAdminDashboard: builder.query({
      query: (params = { days: 90 }) => ({
        url: "/admin/dashboard/real-time-stats",
        params,
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300, // 5 minutes
      transformResponse: (response: any) => {
        // Extract and transform data structure
        const data = response?.data || response;
        
        // Map backend structure to frontend expectations
        return {
          revenue: {
            total: data?.revenue?.today || 0,
            today: data?.revenue?.today || 0,
            last_24h: data?.revenue?.last_24h || 0,
            growth_rate: data?.revenue?.growth_rate || 0,
          },
          orders: {
            total: data?.orders?.today || 0,
            today: data?.orders?.today || 0,
            last_24h: data?.orders?.last_24h || 0,
            last_hour: data?.orders?.last_hour || 0,
            growth_rate: data?.orders?.growth_rate || 0,
          },
          users: {
            active: data?.users?.active_24h || 0,
            new_today: data?.users?.new_today || 0,
            active_24h: data?.users?.active_24h || 0,
          },
          searches: data?.searches || {},
          conversion: data?.conversion || {},
          timestamp: data?.timestamp,
        };
      },
    }),
    getSystemStatus: builder.query({
      query: () => "/admin/dashboard/system-health",
      providesTags: ["System"],
      keepUnusedDataFor: 60, // 1 minute
      transformResponse: (response: any) => {
        // Transform nested structure to flat structure expected by frontend
        console.log('System Status Raw Response:', response);
        const data = response?.data || response;
        console.log('System Status Data:', data);
        const components = data?.components || {};
        console.log('System Status Components:', components);
        
        const transformed = {
          overall_status: data?.overall_status || "unknown",
          timestamp: data?.timestamp,
          // Fields for SystemHealth component
          database_status: components?.database?.status || "unknown",
          database_response_time: components?.database?.response_time_ms || 0,
          api_status: components?.api?.status || "unknown",
          api_response_time: components?.api?.avg_response_time_ms || 0,
          network_status: components?.api?.status || "unknown",
          network_response_time: components?.api?.avg_response_time_ms || 0,
          ml_models_status: components?.ml_models?.status || "unknown",
          ml_models_active_count: components?.ml_models?.active_models || 0,
          // Fields for EnhancedCharts SystemStatusWidget
          database: components?.database?.status || "unknown",
          ml_models_active: components?.ml_models?.active_models || 0,
          recent_activity: {
            orders_24h: 0, // TODO: Add to backend if needed
            new_users_24h: 0, // TODO: Add to backend if needed
          },
        };
        
        console.log('System Status Transformed:', transformed);
        return transformed;
      },
    }),
    getSystemConfig: builder.query({
      query: () => "/admin/settings/settings",
      providesTags: ["System"],
      keepUnusedDataFor: 3600, // 1 hour
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
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/admin/products/${id}`,
        method: "DELETE",
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
        url: "/admin/dashboard/real-time-stats",
        params,
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300,
    }),
    getRecommendationPerformance: builder.query({
      query: (params = { days: 90 }) => ({
        url: "/admin/recommendation-engine/performance",
        params,
      }),
      providesTags: ["Recommendation", "Analytics"],
      keepUnusedDataFor: 180,
      transformResponse: (response: any) => {
        // Backend returns aggregated metrics object, convert to array format for component
        const data = response?.data || {};
        
        // If no data, return empty array
        if (!data.total_displays) {
          return [];
        }
        
        // Convert single aggregated metrics into a summary "Overall" algorithm entry
        return [{
          algorithm: "Overall Performance",
          impressions: data.total_displays || 0,
          click_through_rate: data.ctr || 0,
          conversion_rate: data.cvr || 0,
          revenue_impact: data.total_revenue || 0,
          total_clicks: data.total_clicks || 0,
          total_conversions: data.total_conversions || 0,
        }];
      },
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

    // ML & AI Features
    getMlConfigs: builder.query({
      query: () => "/admin/recommendation-engine/configs",
      providesTags: ["MLConfig"],
      transformResponse: (response: any) => {
        // Extract data array from {status: 'success', data: [...]} wrapper
        return response?.data || [];
      },
    }),
    createMlConfig: builder.mutation({
      query: (configData) => ({
        url: "/admin/recommendation-engine/configs",
        method: "POST",
        body: configData,
      }),
      invalidatesTags: ["MLConfig"],
    }),
    updateMlConfig: builder.mutation({
      query: ({ id, ...configData }) => ({
        url: `/admin/recommendation-engine/configs/${id}`,
        method: "PUT",
        body: configData,
      }),
      invalidatesTags: ["MLConfig"],
    }),
    activateMlConfig: builder.mutation({
      query: (configId) => ({
        url: `/admin/recommendation-engine/configs/${configId}/activate`,
        method: "POST",
      }),
      invalidatesTags: ["MLConfig"],
    }),
    getModelPerformance: builder.query({
      query: (configId) => `/admin/recommendation-engine/configs/${configId}/performance`,
      providesTags: ["MLConfig"],
    }),
    trainModels: builder.mutation({
      query: (trainingData) => ({
        url: "/admin/recommendation-engine/train",
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
      transformResponse: (response: any) => {
        // Extract data array from {status: 'success', data: [...], total_count: X} wrapper
        return response?.data || [];
      },
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
      query: ({ segmentId, ...segmentData }) => ({
        url: `/admin/user-segmentation/segments/${segmentId}`,
        method: "PUT",
        body: segmentData,
      }),
      invalidatesTags: ["UserSegment"],
    }),
    recalculateSegment: builder.mutation({
      query: (segmentId) => ({
        url: `/admin/user-segmentation/segments/${segmentId}/refresh`,
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

    // Additional mutations from v2
    toggleModel: builder.mutation({
      query: ({ modelName }: any) => ({
        url: `/admin/ml-config/${modelName}/toggle`,
        method: "PUT",
      }),
      invalidatesTags: ["MLConfig"],
    }),
    refreshSegments: builder.mutation({
      query: () => ({
        url: "/admin/segmentation/refresh",
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
  useDeleteProductMutation,

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

  // ML & AI
  useGetMlConfigsQuery,
  useCreateMlConfigMutation,
  useUpdateMlConfigMutation,
  useActivateMlConfigMutation,
  useGetModelPerformanceQuery,
  useTrainModelsMutation,
  useToggleModelMutation,

  // User Segmentation
  useGetUserSegmentsQuery,
  useCreateUserSegmentMutation,
  useUpdateUserSegmentMutation,
  useRecalculateSegmentMutation,
  useRecalculateAllSegmentsMutation,
  useRefreshSegmentsMutation,
} = adminApi;
