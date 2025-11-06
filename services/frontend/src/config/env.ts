/**
 * Environment Configuration
 * 
 * Simplified configuration for POC with sensible defaults.
 * All environment variables are managed at root level.
 * Vite exposes env vars through import.meta.env (prefixed with VITE_)
 * 
 * For production, override via:
 * - Docker Compose environment variables
 * - Root .env file with VITE_ prefix
 * - Runtime configuration
 */

interface EnvConfig {
  // API Configuration
  apiBaseUrl: string;
  apiVersion: string;
  apiUrl: string; // Computed: baseUrl + version

  // Environment
  isDevelopment: boolean;
  isProduction: boolean;

  // Feature Flags (all enabled for POC)
  features: {
    analytics: boolean;
    recommendations: boolean;
    bannerGeneration: boolean;
    mlInsights: boolean;
  };
}

/**
 * Get environment variable with fallback
 */
const getEnvVar = (key: keyof ImportMetaEnv, defaultValue: string = ''): string => {
  const value = import.meta.env[key];
  return value !== undefined ? String(value) : defaultValue;
};

/**
 * Application environment configuration with POC-friendly defaults
 */
const env: EnvConfig = {
  // API Configuration - defaults work for local development
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000'),
  apiVersion: getEnvVar('VITE_API_VERSION', 'v1'),
  get apiUrl() {
    return `${this.apiBaseUrl}/api/${this.apiVersion}`;
  },

  // Environment detection
  get isDevelopment() {
    return import.meta.env.DEV;
  },
  get isProduction() {
    return import.meta.env.PROD;
  },

  // Feature Flags - all enabled for POC
  features: {
    analytics: true,
    recommendations: true,
    bannerGeneration: true,
    mlInsights: true,
  },
};

// Log configuration in development only
if (env.isDevelopment) {
  console.log('🔧 Frontend Config:', {
    apiUrl: env.apiUrl,
    features: env.features,
  });
}

export default env;
export type { EnvConfig };
