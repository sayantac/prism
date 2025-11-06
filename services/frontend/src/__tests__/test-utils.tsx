/**
 * Test Utilities
 * Helpers for testing React components and hooks
 */

import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { configureStore, PreloadedState } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { AppStore } from "../store/store";
import { authSlice } from "../store/slices/authSlice";
import { apiSlice } from "../store/api/apiSlice";

/**
 * Create a test store with optional preloaded state
 */
export function setupStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState,
  });
}

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: PreloadedState<RootState>;
  store?: AppStore;
  initialRoute?: string;
}

/**
 * Custom render function with providers
 * Wraps component with Redux Provider and Router
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    initialRoute = "/",
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  window.history.pushState({}, "Test page", initialRoute);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Wait for a condition with timeout
 */
export const waitFor = async (
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> => {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error("Timeout waiting for condition"));
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
};

/**
 * Create mock user data
 */
export const createMockUser = (overrides = {}) => ({
  id: "1",
  username: "testuser",
  email: "test@example.com",
  full_name: "Test User",
  role: "customer",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock product data
 */
export const createMockProduct = (overrides = {}) => ({
  id: "1",
  name: "Test Product",
  slug: "test-product",
  description: "A test product",
  price: 99.99,
  sku: "TEST-001",
  stock_quantity: 100,
  category_id: "1",
  images: [],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock paginated response
 */
export const createMockPaginatedResponse = <T>(
  items: T[],
  page = 1,
  pageSize = 20
) => ({
  items,
  total: items.length,
  page,
  pages: Math.ceil(items.length / pageSize),
  page_size: pageSize,
});

/**
 * Mock API response
 */
export const mockApiResponse = <T>(data: T, delay = 0): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

/**
 * Mock API error
 */
export const mockApiError = (message = "API Error", status = 500) => {
  return Promise.reject({
    status,
    data: { detail: message },
  });
};

// Re-export commonly used testing library utilities
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
