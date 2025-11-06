/**
 * Validation Error Messages
 */

export const VALIDATION_MESSAGES = {
  // Required fields
  REQUIRED: 'This field is required',
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  
  // Email
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_REQUIRED: 'Email is required',
  
  // Password
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: (min: number) => `Password must be at least ${min} characters`,
  PASSWORD_MAX_LENGTH: (max: number) => `Password must not exceed ${max} characters`,
  PASSWORD_UPPERCASE: 'Password must contain at least one uppercase letter',
  PASSWORD_LOWERCASE: 'Password must contain at least one lowercase letter',
  PASSWORD_NUMBER: 'Password must contain at least one number',
  PASSWORD_SPECIAL: 'Password must contain at least one special character',
  PASSWORD_MISMATCH: 'Passwords do not match',
  PASSWORD_WEAK: 'Password is too weak',
  
  // Username
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_MIN_LENGTH: (min: number) => `Username must be at least ${min} characters`,
  USERNAME_MAX_LENGTH: (max: number) => `Username must not exceed ${max} characters`,
  USERNAME_INVALID: 'Username can only contain letters, numbers, underscores, and hyphens',
  USERNAME_TAKEN: 'This username is already taken',
  
  // Phone
  PHONE_INVALID: 'Please enter a valid phone number',
  
  // Product
  PRODUCT_NAME_REQUIRED: 'Product name is required',
  PRODUCT_NAME_MIN_LENGTH: (min: number) => `Product name must be at least ${min} characters`,
  PRODUCT_PRICE_REQUIRED: 'Price is required',
  PRODUCT_PRICE_POSITIVE: 'Price must be a positive number',
  PRODUCT_STOCK_REQUIRED: 'Stock quantity is required',
  PRODUCT_STOCK_POSITIVE: 'Stock quantity must be 0 or greater',
  PRODUCT_CATEGORY_REQUIRED: 'Category is required',
  PRODUCT_DESCRIPTION_REQUIRED: 'Description is required',
  
  // File Upload
  FILE_TOO_LARGE: (maxSize: string) => `File size must not exceed ${maxSize}`,
  FILE_INVALID_TYPE: (types: string) => `Only ${types} files are allowed`,
  FILE_REQUIRED: 'Please select a file',
  
  // General
  INVALID_INPUT: 'Invalid input',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must not exceed ${max} characters`,
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must not exceed ${max}`,
  NUMERIC_ONLY: 'Only numbers are allowed',
  ALPHANUMERIC_ONLY: 'Only letters and numbers are allowed',
  
  // Cart
  CART_EMPTY: 'Your cart is empty',
  QUANTITY_MIN: 'Quantity must be at least 1',
  QUANTITY_MAX: (max: number) => `Maximum quantity is ${max}`,
  OUT_OF_STOCK: 'This item is out of stock',
  INSUFFICIENT_STOCK: (available: number) => `Only ${available} items available`,
  
  // Order
  ADDRESS_REQUIRED: 'Address is required',
  PAYMENT_METHOD_REQUIRED: 'Please select a payment method',
  
  // Search
  SEARCH_QUERY_REQUIRED: 'Please enter a search term',
  SEARCH_MIN_LENGTH: (min: number) => `Search query must be at least ${min} characters`,
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  REGISTER_SUCCESS: 'Account created successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  
  // Product
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  
  // Cart
  ADDED_TO_CART: 'Added to cart',
  REMOVED_FROM_CART: 'Removed from cart',
  CART_UPDATED: 'Cart updated',
  CART_CLEARED: 'Cart cleared',
  
  // Order
  ORDER_PLACED: 'Order placed successfully',
  ORDER_CANCELLED: 'Order cancelled',
  
  // General
  SAVED: 'Changes saved successfully',
  DELETED: 'Deleted successfully',
  UPDATED: 'Updated successfully',
  COPIED: 'Copied to clipboard',
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // General
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  TIMEOUT: 'Request timeout. Please try again.',
  
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  ACCOUNT_DISABLED: 'Your account has been disabled.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address.',
  
  // Product
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_OUT_OF_STOCK: 'This product is out of stock',
  
  // Cart
  CART_ERROR: 'Error updating cart',
  CART_ITEM_NOT_FOUND: 'Item not found in cart',
  
  // Order
  ORDER_FAILED: 'Failed to place order',
  ORDER_NOT_FOUND: 'Order not found',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  
  // File Upload
  UPLOAD_FAILED: 'File upload failed',
  
  // Form
  FORM_VALIDATION_ERROR: 'Please fix the errors and try again',
  FORM_SUBMIT_ERROR: 'Failed to submit form',
  
  // API
  API_ERROR: 'API error occurred',
  RATE_LIMIT: 'Too many requests. Please try again later.',
} as const;

/**
 * Info Messages
 */
export const INFO_MESSAGES = {
  LOADING: 'Loading...',
  PROCESSING: 'Processing...',
  SAVING: 'Saving...',
  DELETING: 'Deleting...',
  UPLOADING: 'Uploading...',
  NO_RESULTS: 'No results found',
  NO_DATA: 'No data available',
  EMPTY_LIST: 'List is empty',
  COMING_SOON: 'Coming soon',
  FEATURE_DISABLED: 'This feature is currently disabled',
} as const;
