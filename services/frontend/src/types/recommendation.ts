/**
 * Recommendation & ML Types
 */

import type { BaseEntity } from './common';
import type { Product } from './product';

// ==================== Recommendation ====================

export type RecommendationType =
  | 'personalized'
  | 'similar'
  | 'trending'
  | 'frequently_bought_together'
  | 'recently_viewed'
  | 'new_arrivals'
  | 'best_sellers';

export interface Recommendation {
  type: RecommendationType;
  products: Product[];
  score?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface RecommendationRequest {
  user_id?: string;
  product_id?: string;
  category_id?: string;
  limit?: number;
  exclude_product_ids?: string[];
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  generated_at: string;
}

// ==================== ML Model ====================

export type MLModelType =
  | 'collaborative_filtering'
  | 'content_based'
  | 'hybrid'
  | 'deep_learning'
  | 'clustering';

export type MLModelStatus = 'training' | 'ready' | 'failed' | 'archived';

export interface MLModel extends BaseEntity {
  name: string;
  type: MLModelType;
  version: string;
  status: MLModelStatus;
  description?: string;
  parameters: Record<string, unknown>;
  metrics?: MLModelMetrics;
  trained_at?: string;
  deployed_at?: string;
  is_active: boolean;
}

export interface MLModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  rmse?: number;
  mae?: number;
  training_time?: number;
  sample_size?: number;
}

// ==================== Training ====================

export interface TrainingJob extends BaseEntity {
  model_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  config: TrainingConfig;
  results?: TrainingResults;
}

export interface TrainingConfig {
  model_type: MLModelType;
  parameters: Record<string, unknown>;
  data_range?: {
    start_date: string;
    end_date: string;
  };
  validation_split?: number;
}

export interface TrainingResults {
  metrics: MLModelMetrics;
  validation_metrics?: MLModelMetrics;
  feature_importance?: Array<{
    feature: string;
    importance: number;
  }>;
  confusion_matrix?: number[][];
}

// ==================== User Behavior ====================

export type BehaviorEventType =
  | 'view'
  | 'click'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'purchase'
  | 'search'
  | 'review'
  | 'wishlist_add'
  | 'wishlist_remove';

export interface BehaviorEvent extends BaseEntity {
  user_id: string;
  event_type: BehaviorEventType;
  product_id?: string;
  category_id?: string;
  search_query?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
  timestamp: string;
}

// ==================== Product Similarity ====================

export interface SimilarProduct {
  product: Product;
  similarity_score: number;
  similarity_type: 'visual' | 'attribute' | 'behavior' | 'hybrid';
}

// ==================== A/B Testing ====================

export interface ABTest extends BaseEntity {
  name: string;
  description?: string;
  type: 'recommendation' | 'ui' | 'pricing' | 'content';
  variants: ABTestVariant[];
  status: 'draft' | 'running' | 'completed' | 'archived';
  start_date: string;
  end_date?: string;
  traffic_allocation: number;
  results?: ABTestResults;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  traffic_percentage: number;
}

export interface ABTestResults {
  variant_results: Array<{
    variant_id: string;
    impressions: number;
    conversions: number;
    conversion_rate: number;
    revenue: number;
    confidence_level: number;
  }>;
  winner?: string;
  statistical_significance: boolean;
}

// ==================== Embeddings ====================

export interface ProductEmbedding {
  product_id: string;
  embedding_vector: number[];
  embedding_type: 'text' | 'image' | 'hybrid';
  model_version: string;
  generated_at: string;
}

export interface SimilaritySearchRequest {
  product_id?: string;
  query?: string;
  embedding_vector?: number[];
  limit?: number;
  threshold?: number;
}

// ==================== Personalization ====================

export interface UserPreferenceProfile {
  user_id: string;
  preferred_categories: Array<{
    category_id: string;
    score: number;
  }>;
  preferred_brands: Array<{
    brand: string;
    score: number;
  }>;
  price_range: {
    min: number;
    max: number;
    average: number;
  };
  purchase_frequency: string;
  last_interaction: string;
  lifetime_value: number;
}
