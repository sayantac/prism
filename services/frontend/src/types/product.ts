/**
 * Product Types
 */

import type { BaseEntity, PaginatedResponse } from './common';

// ==================== Category ====================

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  product_count?: number;
  is_active: boolean;
  order?: number;
}

// ==================== Product ====================

export interface Product extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku: string;
  barcode?: string;
  stock_quantity: number;
  low_stock_threshold?: number;
  category_id: string;
  category?: Category;
  brand?: string;
  tags?: string[];
  images: ProductImage[];
  primary_image?: string;
  specifications?: Record<string, string>;
  features?: string[];
  is_active: boolean;
  is_featured?: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  rating?: number;
  review_count?: number;
  view_count?: number;
  purchase_count?: number;
  discount_percentage?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

// ==================== Product Variant ====================

export interface ProductVariant extends BaseEntity {
  product_id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  attributes: Record<string, string>; // e.g., { color: 'red', size: 'M' }
  image_url?: string;
  is_active: boolean;
}

// ==================== Product Review ====================

export interface ProductReview extends BaseEntity {
  product_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  title?: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  images?: string[];
  is_approved: boolean;
}

export interface CreateReviewData {
  rating: number;
  title?: string;
  comment: string;
  images?: File[];
}

// ==================== Product Filters ====================

export interface ProductFilters {
  category_id?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  is_featured?: boolean;
  brand?: string;
  tags?: string[];
  rating?: number;
  sort_by?: 'price' | 'rating' | 'newest' | 'popular' | 'name';
  sort_order?: 'asc' | 'desc';
}

// ==================== Product Search ====================

export interface ProductSearchParams extends ProductFilters {
  query: string;
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  product: Product;
  score: number;
  highlights?: string[];
}

export type ProductSearchResponse = PaginatedResponse<ProductSearchResult>;

// ==================== Product List ====================

export type ProductListResponse = PaginatedResponse<Product>;

// ==================== Product Stock ====================

export interface StockUpdate {
  product_id: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
  reason?: string;
}

export interface StockHistory extends BaseEntity {
  product_id: string;
  quantity_change: number;
  new_quantity: number;
  reason: string;
  user_id?: string;
}

// ==================== Product Analytics ====================

export interface ProductAnalytics {
  product_id: string;
  views: number;
  clicks: number;
  add_to_cart: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
  average_rating: number;
  period: 'today' | 'week' | 'month' | 'year';
}

// ==================== Recently Viewed ====================

export interface RecentlyViewedProduct {
  product: Product;
  viewed_at: string;
}
