/**
 * Common Types
 * Shared types used across the application
 */

// ==================== Base Types ====================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TimestampedEntity {
  created_at: string;
  updated_at: string;
}

// ==================== Pagination ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==================== API Response ====================

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  detail: string;
  status?: number;
  code?: string;
}

// ==================== Search & Filter ====================

export interface SearchParams extends PaginationParams, SortParams {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
  count?: number;
}

// ==================== Common UI Types ====================

export type LoadingState = 'idle' | 'pending' | 'succeeded' | 'failed';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: unknown;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

// ==================== File Upload ====================

export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  url: string;
  size: number;
  mime_type: string;
  uploaded_at: string;
}

// ==================== Form Types ====================

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export type FormErrors<T> = {
  [K in keyof T]?: string;
};

// ==================== Date & Time ====================

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface TimeRange {
  start_time: string;
  end_time: string;
}

// ==================== Stats & Metrics ====================

export interface Metric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

// ==================== Utility Types ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// ==================== Status Types ====================

export type Status = 'active' | 'inactive' | 'pending' | 'archived';

export type ActionStatus = 'idle' | 'loading' | 'success' | 'error';
