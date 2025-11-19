/**
 * Storage Utilities
 * Helper functions for localStorage and sessionStorage with type safety
 */

import { STORAGE_KEYS } from '@/config';

// ==================== Type-Safe Storage ====================

/**
 * Set item in storage with type safety
 */
export const setStorageItem = <T>(
  key: string,
  value: T,
  storage: Storage = localStorage
): void => {
  try {
    const serialized = JSON.stringify(value);
    storage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error);
  }
};

/**
 * Get item from storage with type safety
 */
export const getStorageItem = <T>(
  key: string,
  defaultValue: T,
  storage: Storage = localStorage
): T => {
  try {
    const item = storage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from storage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Remove item from storage
 */
export const removeStorageItem = (
  key: string,
  storage: Storage = localStorage
): void => {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from storage (${key}):`, error);
  }
};

/**
 * Clear all items from storage
 */
export const clearStorage = (storage: Storage = localStorage): void => {
  try {
    storage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

/**
 * Check if storage is available
 */
export const isStorageAvailable = (type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean => {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// ==================== Auth Storage ====================

/**
 * Save auth token
 */
export const saveAuthToken = (token: string): void => {
  setStorageItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Get auth token
 */
export const getAuthToken = (): string | null => {
  return getStorageItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
};

/**
 * Remove auth token
 */
export const removeAuthToken = (): void => {
  removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Save refresh token
 */
export const saveRefreshToken = (token: string): void => {
  setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Get refresh token
 */
export const getRefreshToken = (): string | null => {
  return getStorageItem<string | null>(STORAGE_KEYS.REFRESH_TOKEN, null);
};

/**
 * Remove refresh token
 */
export const removeRefreshToken = (): void => {
  removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
};

// ==================== Theme Storage ====================

/**
 * Save theme preference
 */
export const saveTheme = (theme: string): void => {
  setStorageItem(STORAGE_KEYS.THEME, theme);
};

/**
 * Get theme preference
 */
export const getTheme = (): string | null => {
  return getStorageItem<string | null>(STORAGE_KEYS.THEME, null);
};

// ==================== Cart Storage ====================

/**
 * Save cart data
 */
export const saveCart = (cart: unknown): void => {
  setStorageItem(STORAGE_KEYS.CART, cart);
};

/**
 * Get cart data
 */
export const getCart = <T>(): T | null => {
  return getStorageItem<T | null>(STORAGE_KEYS.CART, null);
};

/**
 * Clear cart data
 */
export const clearCart = (): void => {
  removeStorageItem(STORAGE_KEYS.CART);
};

// ==================== Recently Viewed ====================

/**
 * Add product to recently viewed
 */
export const addToRecentlyViewed = (productId: string, maxItems: number = 10): void => {
  const items = getStorageItem<string[]>(STORAGE_KEYS.RECENTLY_VIEWED, []);
  const filtered = items.filter(id => id !== productId);
  const updated = [productId, ...filtered].slice(0, maxItems);
  setStorageItem(STORAGE_KEYS.RECENTLY_VIEWED, updated);
};

/**
 * Get recently viewed products
 */
export const getRecentlyViewed = (): string[] => {
  return getStorageItem<string[]>(STORAGE_KEYS.RECENTLY_VIEWED, []);
};

/**
 * Clear recently viewed
 */
export const clearRecentlyViewed = (): void => {
  removeStorageItem(STORAGE_KEYS.RECENTLY_VIEWED);
};

// ==================== Search History ====================

/**
 * Add search term to history
 */
export const addToSearchHistory = (term: string, maxItems: number = 10): void => {
  const history = getStorageItem<string[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
  const filtered = history.filter(t => t.toLowerCase() !== term.toLowerCase());
  const updated = [term, ...filtered].slice(0, maxItems);
  setStorageItem(STORAGE_KEYS.SEARCH_HISTORY, updated);
};

/**
 * Get search history
 */
export const getSearchHistory = (): string[] => {
  return getStorageItem<string[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
};

/**
 * Clear search history
 */
export const clearSearchHistory = (): void => {
  removeStorageItem(STORAGE_KEYS.SEARCH_HISTORY);
};
