import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8000/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "User",
    "Product",
    "Category",
    "Cart",
    "Order",
    "Admin",
    "Analytics",
    "Recommendation",
    "Banner","SystemSummary",
    "UserSegment","BannerTemplates",
    "MLConfig",
    "ViewedProducts",
    "System",
    "BannerConfig",
    "BannerDashboard","ArchivedBanners",
    "Banners","SystemHealth", "CustomerSegments"
  ],
  endpoints: () => ({}),
});
