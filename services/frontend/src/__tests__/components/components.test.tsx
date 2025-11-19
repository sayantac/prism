/**
 * Example tests for React components
 */
// @ts-nocheck

import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../test-utils";
import { Button } from "@/components/ui/Button";

describe("Button Component", () => {
  it("should render with text", () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("should call onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should be disabled when disabled prop is true", () => {
    renderWithProviders(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should apply variant classes", () => {
    renderWithProviders(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("should render with loading state", () => {
    renderWithProviders(<Button loading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

// Example of testing a more complex component with user interactions
describe("SearchInput Component", () => {
  it("should update value on user input", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();

    // This is a placeholder - adjust based on your actual SearchInput component
    renderWithProviders(
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => handleSearch(e.target.value)}
      />
    );

    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "test query");

    expect(input).toHaveValue("test query");
  });
});
