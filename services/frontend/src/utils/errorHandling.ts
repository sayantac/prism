/**
 * Error Handling Utilities
 * Centralized error handling, logging, and user notification
 */

import toast from "react-hot-toast";
import { ERROR_MESSAGES } from "@/constants/messages";

/**
 * Error types for better categorization
 */
export enum ErrorType {
  NETWORK = "NETWORK_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTH_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
}

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  type: ErrorType;
  statusCode?: number;
  isOperational: boolean;
  timestamp: Date;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode?: number,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Extract user-friendly error message from various error formats
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    // API error format
    if ("data" in error && error.data && typeof error.data === "object") {
      const data = error.data as Record<string, unknown>;

      if ("detail" in data && typeof data.detail === "string") {
        return data.detail;
      }

      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
    }

    // RTK Query error
    if ("status" in error && "error" in error) {
      const statusError = error as { status: number; error: string };
      return `${statusError.status}: ${statusError.error}`;
    }
  }

  return ERROR_MESSAGES.SOMETHING_WENT_WRONG;
}

/**
 * Determine error type from status code or error object
 */
export function getErrorType(error: unknown): ErrorType {
  if (error instanceof AppError) {
    return error.type;
  }

  // Check status code
  const statusCode = getStatusCode(error);

  if (statusCode) {
    if (statusCode === 401) return ErrorType.AUTHENTICATION;
    if (statusCode === 403) return ErrorType.AUTHORIZATION;
    if (statusCode === 404) return ErrorType.NOT_FOUND;
    if (statusCode === 422) return ErrorType.VALIDATION;
    if (statusCode >= 500) return ErrorType.SERVER;
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return ErrorType.NETWORK;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Extract status code from error
 */
export function getStatusCode(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    if ("statusCode" in error && typeof error.statusCode === "number") {
      return error.statusCode;
    }

    if ("status" in error && typeof error.status === "number") {
      return error.status;
    }

    if (
      "data" in error &&
      error.data &&
      typeof error.data === "object" &&
      "status" in error.data &&
      typeof (error.data as { status: unknown }).status === "number"
    ) {
      return (error.data as { status: number }).status;
    }
  }

  return undefined;
}

/**
 * Show error notification to user
 */
export function notifyError(error: unknown, customMessage?: string): void {
  const message = customMessage || getErrorMessage(error);
  const errorType = getErrorType(error);

  // Don't show toast for auth errors (handled by redirect)
  if (errorType === ErrorType.AUTHENTICATION) {
    return;
  }

  toast.error(message, {
    duration: 5000,
    position: "top-right",
    icon: "🚨",
  });
}

/**
 * Log error to console or external service
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorType = getErrorType(error);
  const statusCode = getStatusCode(error);
  const message = getErrorMessage(error);

  // Development logging
  if (import.meta.env.DEV) {
    console.group(`[${errorType}] ${message}`);
    console.error("Error:", error);
    if (statusCode) console.log("Status Code:", statusCode);
    if (context) console.log("Context:", context);
    if (error instanceof Error) console.log("Stack:", error.stack);
    console.groupEnd();
  }

  // Production logging (send to monitoring service)
  if (import.meta.env.PROD) {
    // Example: Send to Sentry, LogRocket, etc.
    // window.Sentry?.captureException(error, {
    //   tags: { errorType, statusCode },
    //   extra: { context },
    // });
  }
}

/**
 * Handle error with logging and notification
 */
export function handleError(
  error: unknown,
  options?: {
    context?: Record<string, unknown>;
    customMessage?: string;
    silent?: boolean;
  }
): void {
  // Log error
  logError(error, options?.context);

  // Show notification unless silent
  if (!options?.silent) {
    notifyError(error, options?.customMessage);
  }
}

/**
 * Create error from HTTP response
 */
export function createErrorFromResponse(
  status: number,
  data: unknown
): AppError {
  let message: string = ERROR_MESSAGES.SOMETHING_WENT_WRONG;
  let type = ErrorType.UNKNOWN;

  if (data && typeof data === "object" && "detail" in data) {
    message = String((data as { detail: unknown }).detail);
  }

  switch (status) {
    case 400:
      type = ErrorType.VALIDATION;
      break;
    case 401:
      type = ErrorType.AUTHENTICATION;
      message = ERROR_MESSAGES.UNAUTHORIZED;
      break;
    case 403:
      type = ErrorType.AUTHORIZATION;
      message = ERROR_MESSAGES.FORBIDDEN;
      break;
    case 404:
      type = ErrorType.NOT_FOUND;
      message = ERROR_MESSAGES.NOT_FOUND;
      break;
    case 422:
      type = ErrorType.VALIDATION;
      break;
    case 500:
    case 502:
    case 503:
      type = ErrorType.SERVER;
      message = ERROR_MESSAGES.SERVER_ERROR;
      break;
  }

  return new AppError(message, type, status, true, { data });
}

/**
 * Assert condition or throw error
 */
export function assert(
  condition: unknown,
  message: string,
  errorType: ErrorType = ErrorType.VALIDATION
): asserts condition {
  if (!condition) {
    throw new AppError(message, errorType);
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, { customMessage: errorMessage });
      throw error;
    }
  }) as T;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithErrorHandling<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorType = getErrorType(error);

      // Don't retry on client errors
      if (
        errorType === ErrorType.VALIDATION ||
        errorType === ErrorType.AUTHENTICATION ||
        errorType === ErrorType.AUTHORIZATION ||
        errorType === ErrorType.NOT_FOUND
      ) {
        throw error;
      }

      // Wait before retry
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError;
}
