/**
 * Test Utilities
 * Helpers for testing React components and hooks
 */

import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { store } from "../store/store";
import type { RootState } from "../store/store";

/**
 * Create a test store with optional preloaded state
 */
export function setupStore(_preloadedState?: Partial<RootState>) {
  // For simplicity, just return the main store
  // In a real test setup, you might want to create a separate test store
  return store;
}

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof setupStore>;
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
export function createMockPaginatedResponse<T>(
  items: T[],
  page = 1,
  pageSize = 20
) {
  return {
    items,
    total: items.length,
    page,
    pages: Math.ceil(items.length / pageSize),
    page_size: pageSize,
  };
}

/**
 * Mock API response
 */
export function mockApiResponse<T>(data: T, delay = 0): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

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
