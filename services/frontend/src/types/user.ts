/**
 * User & Authentication Types
 */

import type { BaseEntity } from './common';

// ==================== Role & Permissions ====================

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export type Permission = string;

// ==================== Address ====================

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  apartment?: string;
  address_type: 'billing' | 'shipping' | 'both';
}

// ==================== User ====================

export interface User extends BaseEntity {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: Address;
  roles: Role[];
  permissions: Permission[];
  is_active: boolean;
  is_superuser?: boolean;
  avatar_url?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  currency?: string;
  notifications?: NotificationPreferences;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
}

// ==================== Authentication ====================

export interface LoginCredentials {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface PasswordReset {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePassword {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ==================== Auth State ====================

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ==================== User Profile ====================

export interface UpdateUserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: Address;
  preferences?: Partial<UserPreferences>;
}

// ==================== User Activity ====================

export interface UserActivity extends BaseEntity {
  user_id: string;
  activity_type: 'login' | 'logout' | 'view' | 'purchase' | 'search' | 'review';
  activity_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// ==================== User Segment ====================

export interface UserSegment extends BaseEntity {
  name: string;
  description?: string;
  criteria: Record<string, unknown>;
  user_count: number;
  is_active: boolean;
}
