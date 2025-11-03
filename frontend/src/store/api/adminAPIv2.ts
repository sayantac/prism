// app/store/api/adminApi.js - Complete Admin API with RTK Query
import { apiSlice } from "./apiSlice";

export const adminAPIv2 = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard Metrics
    getAdminDashboard: builder.query({
      query: ({ days = 90 } = {}) => ({
        url: `/admin/analytics/dashboard`,
        params: { days },
      }),
      providesTags: ["Analytics"],
      // Refresh every 5 minutes
      keepUnusedDataFor: 300,
    }),

    // KPIs
    getKpis: builder.query({
      query: ({ days = 90 } = {}) => ({
        url: `/admin/analytics/kpis`,
        params: { days },
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300,
    }),

    // Recommendation Performance
    getRecommendationPerformance: builder.query({
      query: ({ algorithm, days = 90 } = {}) => ({
        url: `/admin/analytics/recommendations/performance`,
        params: { algorithm, days },
      }),
      providesTags: ["Recommendation", "Analytics"],
      keepUnusedDataFor: 180,
    }),

    // Segment Performance
    getSegmentPerformance: builder.query({
      query: () => ({
        url: `/admin/analytics/segments/performance`,
      }),
      providesTags: ["UserSegment", "Analytics"],
      keepUnusedDataFor: 600, // 10 minutes
    }),

    // User Segments
    getUserSegments: builder.query({
      query: () => ({
        url: `/admin/analytics/user-segments`,
      }),
      providesTags: ["UserSegment"],
      keepUnusedDataFor: 600,
    }),

    // ML Model Configurations
    getMlConfigs: builder.query({
      query: () => ({
        url: `/admin/analytics/ml-configs`,
      }),
      providesTags: ["MLConfig"],
      keepUnusedDataFor: 300,
    }),

    // System Status
    getSystemStatus: builder.query({
      query: () => ({
        url: `/admin/analytics/system/status`,
      }),
      providesTags: ["System"],
      keepUnusedDataFor: 60, // 1 minute - more frequent for system status
    }),

    // System Config
    getSystemConfig: builder.query({
      query: () => ({
        url: `/admin/analytics/system/config`,
      }),
      providesTags: ["System"],
      keepUnusedDataFor: 3600, // 1 hour - config changes rarely
    }),

    // Revenue Data with Date Range
    getRevenueData: builder.query({
      query: ({ startDate, endDate, granularity = "daily" } = {}) => ({
        url: `/admin/analytics/revenue`,
        params: { start_date: startDate, end_date: endDate, granularity },
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300,
    }),

    // User Activity Data
    getUserActivityData: builder.query({
      query: ({ days = 90 } = {}) => ({
        url: `/admin/analytics/user-activity`,
        params: { days },
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300,
    }),

    // Search Analytics
    getSearchAnalytics: builder.query({
      query: ({ days = 90 } = {}) => ({
        url: `/admin/analytics/search`,
        params: { days },
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 300,
    }),

    // Top Products
    getTopProducts: builder.query({
      query: ({ days = 90, limit = 10 } = {}) => ({
        url: `/admin/analytics/top-products`,
        params: { days, limit },
      }),
      providesTags: ["Analytics", "Product"],
      keepUnusedDataFor: 300,
    }),

    // Recent Orders
    getRecentOrders: builder.query({
      query: ({ limit = 10 } = {}) => ({
        url: `/admin/orders`,
        params: { page: 1, page_size: limit },
      }),
      providesTags: ["Order", "Analytics"],
      keepUnusedDataFor: 60, // Refresh frequently for recent orders
    }),

    // ML Model Performance
    getModelPerformance: builder.query({
      query: ({ modelName } = {}) => ({
        url: `/admin/ml-config/${modelName}/performance`,
      }),
      providesTags: ["MLConfig", "Analytics"],
      keepUnusedDataFor: 300,
    }),

    // Train ML Model
    trainModel: builder.mutation({
      query: ({ modelName }) => ({
        url: `/admin/ml-config/${modelName}/train`,
        method: "POST",
        body: JSON.stringify({ force_retrain: true, training_parameters: {} }),
      }),
      invalidatesTags: ["MLConfig"],
    }),

    // Toggle ML Model
    toggleModel: builder.mutation({
      query: ({ modelName }) => ({
        url: `/admin/ml-config/${modelName}/toggle`,
        method: "PUT",
      }),
      invalidatesTags: ["MLConfig"],
    }),

    // Refresh User Segments
    refreshSegments: builder.mutation({
      query: () => ({
        url: `/admin/segmentation/refresh`,
        method: "POST",
      }),
      invalidatesTags: ["UserSegment"],
    }),

    // Real-time metrics (polling)
    getRealTimeMetrics: builder.query({
      query: () => ({
        url: `/admin/analytics/realtime`,
      }),
      providesTags: ["Analytics"],
      keepUnusedDataFor: 30, // 30 seconds for real-time data
    }),
  }),
});

// Export hooks for components
export const {
  useGetAdminDashboardQuery,
  useGetKpisQuery,
  useGetRecommendationPerformanceQuery,
  useGetSegmentPerformanceQuery,
  useGetUserSegmentsQuery,
  useGetMlConfigsQuery,
  useGetSystemStatusQuery,
  useGetSystemConfigQuery,
  useGetRevenueDataQuery,
  useGetUserActivityDataQuery,
  useGetSearchAnalyticsQuery,
  useGetTopProductsQuery,
  useGetRecentOrdersQuery,
  useGetModelPerformanceQuery,
  useTrainModelMutation,
  useToggleModelMutation,
  useRefreshSegmentsMutation,
  useGetRealTimeMetricsQuery,
} = adminAPIv2;
