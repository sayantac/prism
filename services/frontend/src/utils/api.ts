/**
 * API Helper Utilities
 */

import type { ApiError } from '../types';

// ==================== Error Handling ====================

/**
 * Parse API error response
 */
export const parseApiError = (error: unknown): string => {
  if (typeof error === 'string') return error;
  
  if (isApiError(error)) {
    return error.detail || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Check if error is an API error
 */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error
  );
};

/**
 * Get error status code
 */
export const getErrorStatus = (error: unknown): number | undefined => {
  if (isApiError(error)) {
    return error.status;
  }
  return undefined;
};

// ==================== Query Params ====================

/**
 * Build query string from params object
 */
export const buildQueryString = (
  params: Record<string, unknown>
): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Parse query string to object
 */
export const parseQueryString = (
  queryString: string
): Record<string, string> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

// ==================== Request Helpers ====================

/**
 * Create form data from object
 */
export const createFormData = (
  data: Record<string, unknown>
): FormData => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (item instanceof File) {
            formData.append(key, item);
          } else {
            formData.append(key, String(item));
          }
        });
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });
  
  return formData;
};

/**
 * Download file from blob
 */
export const downloadFile = (
  blob: Blob,
  filename: string
): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Convert base64 to blob
 */
export const base64ToBlob = (
  base64: string,
  mimeType: string = 'application/octet-stream'
): Blob => {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteArrays = [];
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }
  
  return new Blob([new Uint8Array(byteArrays)], { type: mimeType });
};

// ==================== Cache ====================

/**
 * Create cache key from params
 */
export const createCacheKey = (
  endpoint: string,
  params?: Record<string, unknown>
): string => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, unknown>);
  
  return `${endpoint}:${JSON.stringify(sortedParams)}`;
};

// ==================== Retry Logic ====================

/**
 * Retry async function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};

// ==================== Debounce & Throttle ====================

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ==================== Abort Controller ====================

/**
 * Create abort signal with timeout
 */
export const createAbortSignal = (timeout: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller.signal;
};
