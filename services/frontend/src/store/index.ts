/**
 * Store Exports
 * Central export for Redux store, types, and hooks
 * 
 * Import from this file throughout the application:
 * import { store, useAppDispatch, useAppSelector } from '@/store';
 */

export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';

// Re-export API slices for convenience
export * from './api';

// Re-export Redux slices
export * from './slices';
