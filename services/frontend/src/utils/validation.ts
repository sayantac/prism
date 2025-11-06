/**
 * Validation Utilities
 */

import { VALIDATION } from '../constants';

// ==================== Email ====================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION.EMAIL.PATTERN.test(email);
};

// ==================== Password ====================

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  const { PASSWORD } = VALIDATION;
  
  if (password.length < PASSWORD.MIN_LENGTH) return false;
  if (password.length > PASSWORD.MAX_LENGTH) return false;
  
  if (PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) return false;
  if (PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) return false;
  if (PASSWORD.REQUIRE_NUMBER && !/\d/.test(password)) return false;
  if (PASSWORD.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  
  return true;
};

/**
 * Get password strength score (0-4)
 */
export const getPasswordStrength = (password: string): number => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  return Math.min(strength, 4);
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (password: string): string => {
  const strength = getPasswordStrength(password);
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return labels[strength] || 'Very Weak';
};

// ==================== Username ====================

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  const { USERNAME } = VALIDATION;
  
  if (username.length < USERNAME.MIN_LENGTH) return false;
  if (username.length > USERNAME.MAX_LENGTH) return false;
  
  return USERNAME.PATTERN.test(username);
};

// ==================== Phone ====================

/**
 * Validate phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  return VALIDATION.PHONE.PATTERN.test(phone);
};

// ==================== URL ====================

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ==================== Credit Card ====================

/**
 * Validate credit card number using Luhn algorithm
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Get credit card type from number
 */
export const getCreditCardType = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  
  return 'Unknown';
};

// ==================== File ====================

/**
 * Validate file size
 */
export const isValidFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

/**
 * Validate file type
 */
export const isValidFileType = (file: File, allowedTypes: readonly string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate image dimensions
 */
export const isValidImageDimensions = (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.width <= maxWidth && img.height <= maxHeight);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    
    img.src = url;
  });
};

// ==================== Number ====================

/**
 * Check if value is a valid number
 */
export const isValidNumber = (value: unknown): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Check if value is within range
 */
export const isInRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max;
};

/**
 * Check if value is positive
 */
export const isPositive = (value: number): boolean => {
  return value > 0;
};

// ==================== Date ====================

/**
 * Check if date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

/**
 * Check if date is valid
 */
export const isValidDate = (date: unknown): boolean => {
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }
  return false;
};

// ==================== String ====================

/**
 * Check if string is empty or whitespace
 */
export const isEmpty = (str: string): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * Check if string has minimum length
 */
export const hasMinLength = (str: string, min: number): boolean => {
  return str.length >= min;
};

/**
 * Check if string has maximum length
 */
export const hasMaxLength = (str: string, max: number): boolean => {
  return str.length <= max;
};

// ==================== Object ====================

/**
 * Check if object is empty
 */
export const isEmptyObject = (obj: Record<string, unknown>): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Check if value is an object
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// ==================== Array ====================

/**
 * Check if array is empty
 */
export const isEmptyArray = (arr: unknown[]): boolean => {
  return arr.length === 0;
};

/**
 * Check if value is an array
 */
export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};
