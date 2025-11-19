/// <reference types="vite/client" />

/**
 * Type definitions for environment variables
 * Simplified for POC - only essential variables needed
 * Override these via root .env or Docker environment variables
 */
interface ImportMetaEnv {
  // API Configuration (optional - has defaults)
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_VERSION?: string;

  // Vite built-in
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
