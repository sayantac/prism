/**
 * Error Display Components
 * Reusable components for displaying errors in different contexts
 */

import { AlertTriangle, XCircle, AlertCircle, Info } from "lucide-react";
import type { ReactNode } from "react";

export type ErrorDisplayVariant = "error" | "warning" | "info";

interface ErrorDisplayProps {
  message: string;
  variant?: ErrorDisplayVariant;
  title?: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Inline error display
 */
export function ErrorDisplay({
  message,
  variant = "error",
  title,
  onDismiss,
  action,
}: ErrorDisplayProps) {
  const variants = {
    error: {
      container: "bg-red-50 border-red-200 text-red-800",
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      title: title || "Error",
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200 text-yellow-800",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      title: title || "Warning",
    },
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-800",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: title || "Information",
    },
  };

  const { container, icon, title: defaultTitle } = variants[variant];

  return (
    <div className={`border rounded-lg p-4 ${container}`} role="alert">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1">{title || defaultTitle}</h3>
          )}
          <p className="text-sm">{message}</p>

          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 text-sm font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 -mt-1 -mr-1 p-1 hover:bg-black/5 rounded"
            aria-label="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact error display for forms
 */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Full-page error display
 */
interface ErrorPageProps {
  title: string;
  message: string;
  statusCode?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorPage({
  title,
  message,
  statusCode,
  action,
}: ErrorPageProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {statusCode && (
          <p className="text-6xl font-bold text-gray-900 mb-2">{statusCode}</p>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        {action && (
          <button
            onClick={action.onClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state with optional error context
 */
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Loading error with retry
 */
interface LoadingErrorProps {
  message?: string;
  onRetry: () => void;
}

export function LoadingError({
  message = "Failed to load data",
  onRetry,
}: LoadingErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <XCircle className="w-12 h-12 text-red-600 mb-4" />
      <p className="text-gray-700 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
