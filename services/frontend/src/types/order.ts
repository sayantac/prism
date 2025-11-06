/**
 * Cart & Order Types
 */

import type { BaseEntity } from './common';
import type { Product } from './product';
import type { Address } from './user';

// ==================== Cart ====================

export interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
  selected_variant_id?: string;
  customizations?: Record<string, string>;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  item_count: number;
  applied_coupon?: Coupon;
}

export interface AddToCartData {
  product_id: string;
  quantity: number;
  variant_id?: string;
  customizations?: Record<string, string>;
}

export interface UpdateCartItemData {
  item_id: string;
  quantity: number;
}

// ==================== Coupon ====================

export interface Coupon extends BaseEntity {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'free_shipping';
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface ApplyCouponData {
  code: string;
}

// ==================== Order ====================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'cod' | 'bank_transfer';

export interface Order extends BaseEntity {
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  notes?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  variant_id?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreateOrderData {
  items: {
    product_id: string;
    quantity: number;
    variant_id?: string;
  }[];
  shipping_address: Address;
  billing_address: Address;
  payment_method: PaymentMethod;
  coupon_code?: string;
  notes?: string;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  tracking_number?: string;
  notes?: string;
}

// ==================== Checkout ====================

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'review' | 'confirmation';

export interface CheckoutState {
  current_step: CheckoutStep;
  cart: Cart;
  shipping_address?: Address;
  billing_address?: Address;
  payment_method?: PaymentMethod;
  same_as_shipping: boolean;
  save_info: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  description?: string;
  cost: number;
  estimated_days: string;
  carrier?: string;
}

// ==================== Payment ====================

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
}

export interface PaymentData {
  payment_method: PaymentMethod;
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
  cardholder_name?: string;
  save_card?: boolean;
}

// ==================== Order History ====================

export interface OrderSummary {
  order_id: string;
  order_number: string;
  date: string;
  status: OrderStatus;
  total: number;
  item_count: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}
