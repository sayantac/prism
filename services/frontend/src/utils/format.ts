/**
 * Formatting Utilities
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { CURRENCY, DATE_FORMATS } from '../constants';

// ==================== Currency ====================

/**
 * Format number as currency
 */
export const formatCurrency = (
  amount: number,
  currency: string = CURRENCY.DEFAULT,
  locale: string = CURRENCY.LOCALE
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: CURRENCY.DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY.DECIMAL_PLACES,
  }).format(amount);
};

/**
 * Format currency with symbol prefix
 */
export const formatPrice = (price: number): string => {
  return `${CURRENCY.SYMBOL}${price.toFixed(CURRENCY.DECIMAL_PLACES)}`;
};

/**
 * Format price range
 */
export const formatPriceRange = (minPrice: number, maxPrice: number): string => {
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};

// ==================== Number ====================

/**
 * Format number with thousand separators
 */
export const formatNumber = (
  num: number,
  locale: string = CURRENCY.LOCALE
): string => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format number as percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers (1K, 1M, 1B)
 */
export const formatCompactNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ==================== Date & Time ====================

/**
 * Format date string
 */
export const formatDate = (
  date: string | Date,
  formatStr: string = DATE_FORMATS.DISPLAY
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.DISPLAY_WITH_TIME);
};

/**
 * Format time only
 */
export const formatTime = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.TIME_ONLY);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Invalid date';
  }
};

// ==================== Text ====================

/**
 * Truncate text to specified length
 */
export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Convert string to title case
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/**
 * Convert string to slug
 */
export const toSlug = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Pluralize word based on count
 */
export const pluralize = (
  count: number,
  singular: string,
  plural?: string
): string => {
  const pluralForm = plural || `${singular}s`;
  return count === 1 ? singular : pluralForm;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// ==================== Address ====================

/**
 * Format full address
 */
export const formatAddress = (address: {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}): string => {
  const parts = [
    address.street,
    address.apartment,
    address.city,
    address.state,
    address.zip_code,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
};

/**
 * Format short address (without country)
 */
export const formatShortAddress = (address: {
  city: string;
  state: string;
}): string => {
  return `${address.city}, ${address.state}`;
};

// ==================== Miscellaneous ====================

/**
 * Format order number
 */
export const formatOrderNumber = (orderNumber: string): string => {
  return `#${orderNumber}`;
};

/**
 * Format rating
 */
export const formatRating = (rating: number, decimals: number = 1): string => {
  return `${rating.toFixed(decimals)} ⭐`;
};

/**
 * Format initials from name
 */
export const formatInitials = (
  firstName: string,
  lastName: string
): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

/**
 * Highlight search terms in text
 */
export const highlightText = (
  text: string,
  searchTerm: string,
  className: string = 'bg-yellow-200'
): string => {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, `<span class="${className}">$1</span>`);
};
