/**
 * Analytics & Admin Types
 */

import type { BaseEntity, DateRange } from './common';

// ==================== Analytics ====================

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  revenue_change: number;
  orders_change: number;
  customers_change: number;
  conversion_rate: number;
  average_order_value: number;
}

export interface RevenueMetrics {
  daily_revenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  revenue_by_category: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  revenue_by_product: Array<{
    product_id: string;
    product_name: string;
    revenue: number;
    units_sold: number;
  }>;
  total_revenue: number;
  period: DateRange;
}

export interface CustomerMetrics {
  new_customers: number;
  returning_customers: number;
  customer_retention_rate: number;
  churn_rate: number;
  lifetime_value: number;
  acquisition_cost: number;
  customer_segments: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  views: number;
  cart_additions: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
  average_rating: number;
  stock_level: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CategoryPerformance {
  category_id: string;
  category_name: string;
  revenue: number;
  orders: number;
  products_sold: number;
  average_order_value: number;
  growth_rate: number;
}

// ==================== Funnel Analytics ====================

export interface ConversionFunnel {
  steps: Array<{
    name: string;
    count: number;
    conversion_rate: number;
    drop_off_rate: number;
  }>;
  overall_conversion_rate: number;
  total_entered: number;
  total_converted: number;
}

// ==================== User Behavior Analytics ====================

export interface UserBehaviorStats {
  sessions: number;
  page_views: number;
  average_session_duration: number;
  bounce_rate: number;
  pages_per_session: number;
  top_pages: Array<{
    page: string;
    views: number;
    unique_visitors: number;
  }>;
  user_flow: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}

// ==================== Search Analytics ====================

export interface SearchAnalytics {
  top_searches: Array<{
    query: string;
    count: number;
    results_count: number;
    click_through_rate: number;
  }>;
  no_results_searches: Array<{
    query: string;
    count: number;
  }>;
  search_conversion_rate: number;
  average_results_clicked: number;
}

// ==================== Banner ====================

export type BannerType = 'hero' | 'promotional' | 'category' | 'product' | 'seasonal';
export type BannerStatus = 'draft' | 'active' | 'scheduled' | 'expired' | 'archived';

export interface Banner extends BaseEntity {
  title: string;
  description?: string;
  type: BannerType;
  status: BannerStatus;
  image_url: string;
  mobile_image_url?: string;
  link_url?: string;
  link_text?: string;
  start_date: string;
  end_date?: string;
  priority: number;
  target_audience?: string[];
  impressions: number;
  clicks: number;
  click_through_rate: number;
  is_ai_generated: boolean;
  generation_prompt?: string;
}

export interface CreateBannerData {
  title: string;
  description?: string;
  type: BannerType;
  image?: File;
  link_url?: string;
  link_text?: string;
  start_date: string;
  end_date?: string;
  priority?: number;
  target_audience?: string[];
}

export interface GenerateBannerRequest {
  prompt: string;
  style?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  product_ids?: string[];
  category_id?: string;
}

// ==================== System Health ====================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    response_time?: number;
    last_checked: string;
    error_message?: string;
  }>;
  database: {
    status: 'up' | 'down';
    connections: number;
    response_time: number;
  };
  cache: {
    status: 'up' | 'down';
    hit_rate: number;
    memory_usage: number;
  };
  ml_models: Array<{
    name: string;
    status: 'ready' | 'training' | 'failed';
    last_trained: string;
    accuracy?: number;
  }>;
}

// ==================== Audit Log ====================

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import';

export interface AuditLog extends BaseEntity {
  user_id: string;
  user_email: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

// ==================== Settings ====================

export interface SystemSettings {
  general: {
    site_name: string;
    site_description: string;
    contact_email: string;
    support_phone: string;
    currency: string;
    timezone: string;
  };
  features: {
    enable_recommendations: boolean;
    enable_ai_features: boolean;
    enable_reviews: boolean;
    enable_wishlist: boolean;
    enable_guest_checkout: boolean;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    from_email: string;
    from_name: string;
  };
  payment: {
    enabled_methods: string[];
    test_mode: boolean;
  };
  shipping: {
    enabled_carriers: string[];
    free_shipping_threshold?: number;
    handling_time_days: number;
  };
}

// ==================== Notifications ====================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'order' | 'system';

export interface Notification extends BaseEntity {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  read_at?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminNotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  order_updates: boolean;
  promotional_emails: boolean;
  product_recommendations: boolean;
}
