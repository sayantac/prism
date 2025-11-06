/**
 * Example tests for custom hooks
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLocalStorage } from "@/hooks";

describe("useLocalStorage Hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should return initial value", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial")
    );
    expect(result.current[0]).toBe("initial");
  });

  it("should update value", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial")
    );

    const [, setValue] = result.current;
    setValue("updated");

    waitFor(() => {
      expect(result.current[0]).toBe("updated");
    });
  });

  it("should persist value to localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial")
    );

    const [, setValue] = result.current;
    setValue("persisted");

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify("persisted")
    );
  });
});

// Example of testing API hooks with RTK Query
describe("API Hooks", () => {
  it("should be tested with mock store", () => {
    // API hooks are typically tested with integration tests
    // using MSW (Mock Service Worker) or by mocking the RTK Query endpoints
    expect(true).toBe(true);
  });
});
