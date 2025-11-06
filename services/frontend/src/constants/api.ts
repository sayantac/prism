/**
 * API Endpoint Paths
 * Central definition of all API endpoint paths (without base URL)
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    ADDRESSES: '/users/addresses',
    ACTIVITY: '/users/activity',
  },
  
  // Products
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    CATEGORIES: '/products/categories',
    SEARCH: '/search',
    REVIEWS: (id: string) => `/products/${id}/reviews`,
    VIEW: (id: string) => `/products/${id}/view`,
    RECENTLY_VIEWED: '/products/recently-viewed',
  },
  
  // Cart
  CART: {
    BASE: '/cart',
    ITEMS: '/cart/items',
    ITEM: (id: string) => `/cart/items/${id}`,
    CLEAR: '/cart/clear',
    COUNT: '/cart/count',
    APPLY_COUPON: '/cart/coupon',
  },
  
  // Orders
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    TRACKING: (id: string) => `/orders/${id}/tracking`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
  },
  
  // Recommendations
  RECOMMENDATIONS: {
    PERSONALIZED: '/recommendations/personalized',
    SIMILAR: (productId: string) => `/recommendations/similar/${productId}`,
    TRENDING: '/recommendations/trending',
    FREQUENTLY_BOUGHT: (productId: string) => `/recommendations/frequently-bought/${productId}`,
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    REVENUE: '/analytics/revenue',
    CUSTOMERS: '/analytics/customers',
    PRODUCTS: '/analytics/products',
    CATEGORIES: '/analytics/categories',
    FUNNEL: '/analytics/funnel',
    USER_BEHAVIOR: '/analytics/user-behavior',
    SEARCH: '/analytics/search',
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    USERS: '/admin/users',
    BANNERS: '/admin/banners',
    BANNER_GENERATE: '/admin/banners/generate',
    ML_MODELS: '/admin/ml-models',
    ML_TRAIN: '/admin/ml-models/train',
    SETTINGS: '/admin/settings',
    SYSTEM_HEALTH: '/admin/system/health',
    AUDIT_LOGS: '/admin/audit-logs',
    USER_SEGMENTS: '/admin/user-segments',
  },
} as const;
