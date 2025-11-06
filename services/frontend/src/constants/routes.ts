/**
 * Application Routes
 * Central definition of all application routes
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  SEARCH: '/search',
  CATEGORY: (slug: string) => `/category/${slug}`,
  
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // User routes
  PROFILE: '/profile',
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  WISHLIST: '/wishlist',
  SETTINGS: '/settings',
  
  // Cart & Checkout
  CART: '/cart',
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/success',
  CHECKOUT_CANCELLED: '/checkout/cancelled',
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin',
    PRODUCTS: '/admin/products',
    PRODUCT_CREATE: '/admin/products/new',
    PRODUCT_EDIT: (id: string) => `/admin/products/${id}/edit`,
    CATEGORIES: '/admin/categories',
    ORDERS: '/admin/orders',
    ORDER_DETAIL: (id: string) => `/admin/orders/${id}`,
    USERS: '/admin/users',
    USER_DETAIL: (id: string) => `/admin/users/${id}`,
    ANALYTICS: '/admin/analytics',
    BANNERS: '/admin/banners',
    ML_MODELS: '/admin/ml',
    RECOMMENDATIONS: '/admin/recommendations',
    SETTINGS: '/admin/settings',
    USER_SEGMENTS: '/admin/user-segments',
    AI_BUNDLES: '/admin/ai-bundles',
  },
} as const;
