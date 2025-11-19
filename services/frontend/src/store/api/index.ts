/**
 * API Exports
 * Central export for all RTK Query API slices
 * 
 * Note: Some hooks like useGetRelatedProductsQuery, useGetTrendingProductsQuery,
 * and useGetUserBannersQuery exist in multiple API slices. Import directly from
 * the specific API file if needed to avoid ambiguity.
 */

export { apiSlice } from './apiSlice';
export { adminApi } from './adminApi';
export { authApi } from './authApi';
export { cartApi } from './cartApi';
export { orderApi } from './orderApi';
export { productApi } from './productApi';
export { recommendationApi } from './recommendationApi';
export { bannerManagementApi } from './bannerGeneration';
