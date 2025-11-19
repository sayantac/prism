/**
 * Application Configuration Constants
 */

// ==================== Pagination ====================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
  MAX_PAGE_SIZE: 100,
} as const;

// ==================== File Upload ====================

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
  ACCEPTED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'] as const,
} as const;

// ==================== Validation ====================

export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  },
  PRODUCT: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 200,
    DESCRIPTION_MIN_LENGTH: 10,
    DESCRIPTION_MAX_LENGTH: 5000,
    MIN_PRICE: 0,
    MAX_PRICE: 1000000,
  },
} as const;

// ==================== Date & Time ====================

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a',
  DISPLAY_LONG: 'MMMM dd, yyyy',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
  TIME_ONLY: 'hh:mm a',
} as const;

// ==================== Currency ====================

export const CURRENCY = {
  DEFAULT: 'USD',
  SYMBOL: '$',
  DECIMAL_PLACES: 2,
  LOCALE: 'en-US',
} as const;

// ==================== Timeout ====================

export const TIMEOUT = {
  API_REQUEST: 30000, // 30 seconds
  DEBOUNCE_SEARCH: 500, // 500ms
  TOAST_DURATION: 4000, // 4 seconds
  RETRY_DELAY: 1000, // 1 second
  MAX_RETRIES: 3,
} as const;

// ==================== Status ====================

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// ==================== Sorting ====================

export const SORT_OPTIONS = {
  PRODUCTS: [
    { label: 'Newest', value: 'newest' },
    { label: 'Popular', value: 'popular' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Rating', value: 'rating' },
    { label: 'Name: A to Z', value: 'name_asc' },
    { label: 'Name: Z to A', value: 'name_desc' },
  ],
  ORDERS: [
    { label: 'Recent', value: 'recent' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Amount: High to Low', value: 'amount_desc' },
    { label: 'Amount: Low to High', value: 'amount_asc' },
  ],
} as const;

// ==================== Rating ====================

export const RATING = {
  MIN: 1,
  MAX: 5,
  STEP: 0.5,
} as const;

// ==================== Product ====================

export const PRODUCT_STATUS = {
  IN_STOCK: 'in_stock',
  OUT_OF_STOCK: 'out_of_stock',
  LOW_STOCK: 'low_stock',
  DISCONTINUED: 'discontinued',
} as const;

// ==================== Analytics ====================

export const ANALYTICS_PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'week' },
  { label: 'Last 30 Days', value: 'month' },
  { label: 'Last 90 Days', value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom Range', value: 'custom' },
] as const;

// ==================== Chart Colors ====================

export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#6366f1',
  PURPLE: '#a855f7',
  PINK: '#ec4899',
  TEAL: '#14b8a6',
  ORANGE: '#f97316',
  GRAY: '#6b7280',
} as const;

// ==================== Breakpoints (matching Tailwind) ====================

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// ==================== Animation ====================

export const ANIMATION = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    IN: 'cubic-bezier(0.4, 0, 1, 1)',
    OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;
