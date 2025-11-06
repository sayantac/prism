/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiSlice } from "./apiSlice";

// Type definitions for Banner Management
export interface Banner {
  id: string;
  prompt: string;
  product_id?: string;
  product_name?: string;
  product_category?: string;
  is_published: boolean;
  priority: number;
  created_at?: string;
  created_by?: string;
  creator_email?: string;
  creator_name?: string;
  start_date?: string;
  end_date?: string;
  status: "published" | "draft" | "expired" | "active";
  target_audience?: any;
  image_path?: string;
  image_base64?: string;
}

export interface BannerFilters {
  page?: number;
  page_size?: number;
  status_filter?: "published" | "draft" | "expired" | "active";
  category_filter?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface BannerRequest {
  prompt: string;
  user_id?: string;
  aspect_ratio?: string;
  product_id?: string;
}

export interface BannerPublishRequest {
  banner_id: string;
  target_audience: {
    banner_id: string;
    cluster_ids: number[];
    region?: string;
    min_spend?: number;
    max_recency_days?: number;
  };
  start_date?: string;
  end_date?: string;
  priority?: number;
}

export interface BannerTemplate {
  id: string;
  name: string;
  description?: string;
  prompt_template: string;
  category: string;
  default_aspect_ratio: string;
  created_by?: string;
  creator_email?: string;
  created_at: string;
}

export interface BannerInteraction {
  banner_id: string;
  action_type: "impression" | "click" | "conversion";
  user_id?: string;
  session_id?: string;
}

// Simplified Banner Management API
export const bannerManagementApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📊 Dashboard & Overview
    getBannerDashboard: builder.query<any, void>({
      query: () => "/admin/banners/dashboard",
      providesTags: ["BannerDashboard"],
    }),

    getBannerSystemSummary: builder.query<any, void>({
      query: () => "/admin/banners/summary",
      providesTags: ["SystemSummary"],
    }),

    // 🎯 Banner CRUD Operations
    getAllBanners: builder.query<any, BannerFilters>({
      query: (filters = {}) => ({
        url: "/admin/banners/banners",
        params: filters,
      }),
      providesTags: ["Banners"],
    }),

    getBanner: builder.query<Banner, string>({
      query: (bannerId) => `/recommendations/banner/${bannerId}`,
      providesTags: (result, error, bannerId) => [
        { type: "Banner", id: bannerId },
      ],
    }),

    generateBanner: builder.mutation<any, BannerRequest>({
      query: (bannerData) => ({
        url: "/recommendations/generate-banner",
        method: "POST",
        body: bannerData,
      }),
      invalidatesTags: ["Banners", "BannerDashboard"],
    }),

    updateBanner: builder.mutation<any, { bannerId: string; updates: any }>({
      query: ({ bannerId, updates }) => ({
        url: `/admin/banners/banners/${bannerId}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { bannerId }) => [
        { type: "Banner", id: bannerId },
        "Banners",
        "BannerDashboard",
      ],
    }),

    deleteBanner: builder.mutation<any, string>({
      query: (bannerId) => ({
        url: `/admin/banners/banners/${bannerId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, bannerId) => [
        { type: "Banner", id: bannerId },
        "Banners",
        "BannerDashboard",
      ],
    }),

    duplicateBanner: builder.mutation<
      any,
      { bannerId: string; modifications?: any }
    >({
      query: ({ bannerId, modifications }) => ({
        url: `/admin/banners/banners/${bannerId}/duplicate`,
        method: "POST",
        body: { modifications },
      }),
      invalidatesTags: ["Banners", "BannerDashboard"],
    }),

    // 📢 Banner Publishing & Scheduling
    publishBanner: builder.mutation<any, BannerPublishRequest>({
      query: (publishData) => ({
        url: "/recommendations/publish-banner",
        method: "POST",
        body: publishData,
      }),
      invalidatesTags: (result, error, { banner_id }) => [
        { type: "Banner", id: banner_id },
        "Banners",
        "BannerDashboard",
      ],
    }),

    scheduleBanner: builder.mutation<
      any,
      { bannerId: string; scheduleData: any }
    >({
      query: ({ bannerId, scheduleData }) => ({
        url: `/admin/banners/banners/${bannerId}/schedule`,
        method: "POST",
        body: scheduleData,
      }),
      invalidatesTags: (result, error, { bannerId }) => [
        { type: "Banner", id: bannerId },
        "Banners",
      ],
    }),

    // 📝 Templates
    getBannerTemplates: builder.query<
      { templates: BannerTemplate[] },
      { category?: string }
    >({
      query: (params = {}) => ({
        url: "/admin/banners/banners/templates",
        params,
      }),
      providesTags: ["BannerTemplates"],
    }),

    createBannerTemplate: builder.mutation<any, any>({
      query: (templateData) => ({
        url: "/admin/banners/banners/templates",
        method: "POST",
        body: templateData,
      }),
      invalidatesTags: ["BannerTemplates"],
    }),

    generateFromTemplate: builder.mutation<
      any,
      { templateId: string; variables: Record<string, string> }
    >({
      query: ({ templateId, variables }) => ({
        url: "/admin/banners/banners/generate-from-template",
        method: "POST",
        body: { template_id: templateId, variables },
      }),
      invalidatesTags: ["Banners", "BannerDashboard"],
    }),

    // 📊 Basic Tracking
    trackBannerInteraction: builder.mutation<any, BannerInteraction>({
      query: (interactionData) => ({
        url: "/admin/banners/banners/track-interaction",
        method: "POST",
        body: interactionData,
      }),
      // Don't invalidate tags for tracking - too frequent
    }),

    // 👥 User & Audience Management
    getUserBanners: builder.query<any, { userId: string; limit?: number }>({
      query: ({ userId, limit = 5 }) => ({
        url: `/recommendations/user-banners/${userId}`,
        params: { limit },
      }),
      providesTags: (result, error, { userId }) => [
        { type: "UserBanners", id: userId },
      ],
    }),

    getCustomerSegments: builder.query<any, void>({
      query: () => "/recommendations/customer-segments",
      providesTags: ["CustomerSegments"],
    }),

    // 🔧 Basic System Management
    getSystemHealth: builder.query<any, void>({
      query: () => "/admin/banners/system/health",
      providesTags: ["SystemHealth"],
    }),

    // 🗂️ Archive Management
    archiveBanner: builder.mutation<any, string>({
      query: (bannerId) => ({
        url: `/admin/banners/banners/${bannerId}/archive`,
        method: "POST",
      }),
      invalidatesTags: (result, error, bannerId) => [
        { type: "Banner", id: bannerId },
        "Banners",
        "ArchivedBanners",
      ],
    }),

    restoreBanner: builder.mutation<any, string>({
      query: (bannerId) => ({
        url: `/admin/banners/banners/${bannerId}/restore`,
        method: "POST",
      }),
      invalidatesTags: (result, error, bannerId) => [
        { type: "Banner", id: bannerId },
        "Banners",
        "ArchivedBanners",
      ],
    }),

    getArchivedBanners: builder.query<
      any,
      { page?: number; page_size?: number }
    >({
      query: (params = {}) => ({
        url: "/admin/banners/banners/archived",
        params,
      }),
      providesTags: ["ArchivedBanners"],
    }),

    // 🔄 Data Management
    syncProductData: builder.mutation<any, void>({
      query: () => ({
        url: "/admin/banners/integrations/sync-products",
        method: "POST",
      }),
      invalidatesTags: ["Banners", "BannerDashboard"],
    }),

    // 📤 Export
    exportBanners: builder.query<
      any,
      {
        format?: "csv" | "json";
        date_from?: string;
        date_to?: string;
        status_filter?: string;
      }
    >({
      query: (params = {}) => ({
        url: "/admin/banners/banners/export",
        params,
      }),
    }),

    validateBanner: builder.query<any, string>({
      query: (bannerId) => `/admin/banners/banners/${bannerId}/validate`,
      providesTags: (result, error, bannerId) => [
        { type: "BannerValidation", id: bannerId },
      ],
    }),

    // ⚙️ Configuration
    getBannerConfig: builder.query<any, void>({
      query: () => "/admin/banners/config",
      providesTags: ["BannerConfig"],
    }),

    // 🎨 Personalized Promotions (from existing APIs)
    generatePersonalizedPromotion: builder.mutation<any, any>({
      query: (promotionData) => ({
        url: "/recommendations/personalized-promotion",
        method: "POST",
        body: promotionData,
      }),
    }),

    generatePromotion: builder.mutation<any, any>({
      query: (adRequest) => ({
        url: "/recommendations/generate-promotion",
        method: "POST",
        body: adRequest,
      }),
    }),
  }),
});

// Export simplified hooks
export const {
  // Dashboard & Overview
  useGetBannerDashboardQuery,
  useGetBannerSystemSummaryQuery,

  // Banner CRUD
  useGetAllBannersQuery,
  useGetBannerQuery,
  useGenerateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useDuplicateBannerMutation,

  // Publishing & Scheduling
  usePublishBannerMutation,
  useScheduleBannerMutation,

  // Templates
  useGetBannerTemplatesQuery,
  useCreateBannerTemplateMutation,
  useGenerateFromTemplateMutation,

  // Tracking
  useTrackBannerInteractionMutation,

  // User & Audience
  useGetUserBannersQuery,
  useGetCustomerSegmentsQuery,

  // System Management
  useGetSystemHealthQuery,

  // Archive Management
  useArchiveBannerMutation,
  useRestoreBannerMutation,
  useGetArchivedBannersQuery,

  // Data Management
  useSyncProductDataMutation,

  // Export & Validation
  useExportBannersQuery,
  useValidateBannerQuery,

  // Configuration
  useGetBannerConfigQuery,

  // Personalized Promotions
  useGeneratePersonalizedPromotionMutation,
  useGeneratePromotionMutation,
} = bannerManagementApi;

// Simplified utility hooks
export const useBannerManagement = () => {
  return {
    // Quick access to common operations
    dashboard: useGetBannerDashboardQuery(),
    allBanners: useGetAllBannersQuery({}),
    systemHealth: useGetSystemHealthQuery(),

    // Common mutations
    generateBanner: useGenerateBannerMutation(),
    publishBanner: usePublishBannerMutation(),
    trackInteraction: useTrackBannerInteractionMutation(),
  };
};

// Utility functions for API data transformation
export const bannerUtils = {
  // Transform banner data for UI display
  transformBannerForDisplay: (banner: Banner) => ({
    ...banner,
    statusColor: {
      published: "green",
      draft: "gray",
      expired: "red",
      active: "blue",
    }[banner.status],

    shortPrompt:
      banner.prompt.length > 100
        ? banner.prompt.substring(0, 100) + "..."
        : banner.prompt,
  }),

  // Format dates for display
  formatDate: (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Generate filter options for UI
  getFilterOptions: (banners: Banner[]) => ({
    categories: [
      ...new Set(banners.map((b) => b.product_category).filter(Boolean)),
    ],
    creators: [...new Set(banners.map((b) => b.creator_email).filter(Boolean))],
    statuses: ["published", "draft", "expired", "active"],
  }),
};

// Error handling utilities
export const bannerErrorHandlers = {
  handleBannerError: (error: any) => {
    if (error?.status === 404) {
      return "Banner not found";
    } else if (error?.status === 403) {
      return "You don't have permission to perform this action";
    } else if (error?.status === 400) {
      return error?.data?.detail || "Invalid request data";
    } else if (error?.status === 500) {
      return "Server error. Please try again later.";
    } else {
      return "An unexpected error occurred";
    }
  },

  handleValidationError: (error: any) => {
    if (error?.data?.details) {
      return error.data.details.map((d: any) => d.message).join(", ");
    }
    return bannerErrorHandlers.handleBannerError(error);
  },
};
