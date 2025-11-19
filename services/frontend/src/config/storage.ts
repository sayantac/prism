/**
 * Storage Configuration
 * Local storage, session storage, and cache key definitions
 */

// ==================== Local Storage Keys ====================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  CART: 'cart',
  RECENTLY_VIEWED: 'recently_viewed',
  SEARCH_HISTORY: 'search_history',
  PREFERENCES: 'user_preferences',
} as const;

// ==================== Cache Keys ====================

export const CACHE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  USER_PROFILE: 'user_profile',
  CART: 'cart',
  RECOMMENDATIONS: 'recommendations',
} as const;
