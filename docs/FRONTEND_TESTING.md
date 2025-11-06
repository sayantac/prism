# Testing Guide

This frontend uses **Vitest** for unit testing and **React Testing Library** for component testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## Test Structure

Tests are colocated with the code they test in `__tests__` directories:

```
src/
  components/
    __tests__/
      Button.test.tsx
  hooks/
    __tests__/
      useLocalStorage.test.ts
  utils/
    __tests__/
      format.test.ts
```

## Writing Tests

### Testing Utilities

Import test utilities from `@/test/test-utils`:

```typescript
import { renderWithProviders, screen, userEvent } from "@/test/test-utils";
import { describe, it, expect, vi } from "vitest";
```

### Testing Components

```typescript
import { renderWithProviders, screen } from "@/test/test-utils";
import { MyComponent } from "../MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    renderWithProviders(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing with Redux Store

```typescript
import { renderWithProviders } from "@/test/test-utils";

it("should work with preloaded state", () => {
  const preloadedState = {
    auth: {
      user: { id: "1", username: "testuser" },
      isAuthenticated: true,
    },
  };

  renderWithProviders(<MyComponent />, { preloadedState });
  expect(screen.getByText("testuser")).toBeInTheDocument();
});
```

### Testing Hooks

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useMyHook } from "../useMyHook";

describe("useMyHook", () => {
  it("should return expected value", () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe("expected");
  });

  it("should update on action", async () => {
    const { result } = renderHook(() => useMyHook());

    result.current.updateValue("new value");

    await waitFor(() => {
      expect(result.current.value).toBe("new value");
    });
  });
});
```

### Testing Utility Functions

```typescript
import { describe, it, expect } from "vitest";
import { formatCurrency } from "../format";

describe("formatCurrency", () => {
  it("should format USD correctly", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("should handle zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});
```

## Mocking

### Mocking Functions

```typescript
import { vi } from "vitest";

const mockFn = vi.fn();
mockFn.mockReturnValue("mocked value");
mockFn.mockResolvedValue("async mocked value");
```

### Mocking Modules

```typescript
vi.mock("@/utils/api", () => ({
  fetchData: vi.fn().mockResolvedValue({ data: "mocked" }),
}));
```

### Mocking API Calls

For API testing, consider using MSW (Mock Service Worker):

```typescript
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.get("/api/products", (req, res, ctx) => {
    return res(ctx.json({ items: [] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test Utilities Reference

### `renderWithProviders`

Renders a component with all necessary providers (Redux, Router):

```typescript
const { store } = renderWithProviders(<MyComponent />, {
  preloadedState: { auth: { user: mockUser } },
  initialRoute: "/products",
});
```

### Mock Data Creators

```typescript
import {
  createMockUser,
  createMockProduct,
  createMockPaginatedResponse,
} from "@/test/test-utils";

const user = createMockUser({ username: "john" });
const product = createMockProduct({ name: "Test Product" });
const response = createMockPaginatedResponse([product], 1, 20);
```

### API Mocking Helpers

```typescript
import { mockApiResponse, mockApiError } from "@/test/test-utils";

// Mock successful response
const data = await mockApiResponse({ id: "1", name: "Test" }, 100);

// Mock error response
await mockApiError("Not found", 404);
```

## Coverage

Coverage reports are generated in `coverage/` directory:

- `coverage/index.html` - HTML report
- `coverage/coverage-final.json` - JSON report

### Coverage Thresholds

Aim for:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Best Practices

1. **Test behavior, not implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state or implementation details

2. **Use descriptive test names**
   - `it("should display error message when form is invalid")`
   - Not: `it("test error message")`

3. **Follow AAA pattern**
   - **Arrange**: Set up test data and conditions
   - **Act**: Execute the code being tested
   - **Assert**: Verify the expected outcome

4. **Keep tests focused**
   - One assertion per test when possible
   - Test one behavior at a time

5. **Use data-testid sparingly**
   - Prefer semantic queries (role, label, text)
   - Use `getByRole`, `getByLabelText`, `getByText` first

6. **Clean up after tests**
   - Use `beforeEach` and `afterEach` for setup/teardown
   - Clear mocks and reset state

7. **Test edge cases**
   - Empty states
   - Loading states
   - Error states
   - Boundary values

## Common Testing Patterns

### Testing Async Operations

```typescript
it("should load data", async () => {
  renderWithProviders(<DataComponent />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText("Data loaded")).toBeInTheDocument();
  });
});
```

### Testing Forms

```typescript
it("should submit form", async () => {
  const handleSubmit = vi.fn();
  const user = userEvent.setup();

  renderWithProviders(<MyForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText("Name"), "John");
  await user.click(screen.getByRole("button", { name: "Submit" }));

  expect(handleSubmit).toHaveBeenCalledWith({ name: "John" });
});
```

### Testing Navigation

```typescript
it("should navigate on click", async () => {
  const user = userEvent.setup();

  renderWithProviders(<Navigation />, { initialRoute: "/" });

  await user.click(screen.getByRole("link", { name: "Products" }));

  await waitFor(() => {
    expect(window.location.pathname).toBe("/products");
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
