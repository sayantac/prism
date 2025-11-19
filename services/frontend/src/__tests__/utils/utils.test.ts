/**
 * Example tests for utility functions
 */
// @ts-nocheck

import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  truncateText,
  toTitleCase,
  toSlug,
} from "@/utils/format";
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  getPasswordStrength,
} from "@/utils/validation";

describe("Format Utilities", () => {
  describe("formatCurrency", () => {
    it("should format number as USD currency", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency(99.9)).toBe("$99.90");
    });

    it("should handle different currencies", () => {
      expect(formatCurrency(1000, "EUR")).toContain("1,000.00");
      expect(formatCurrency(1000, "GBP")).toContain("1,000.00");
    });
  });

  describe("formatNumber", () => {
    it("should format numbers with commas", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1000000)).toBe("1,000,000");
    });

    it("should handle decimals", () => {
      expect(formatNumber(1234.56, 2)).toBe("1,234.56");
      expect(formatNumber(1234.5678, 2)).toBe("1,234.57");
    });
  });

  describe("truncateText", () => {
    it("should truncate long text", () => {
      const longText = "This is a very long text that needs to be truncated";
      expect(truncateText(longText, 10)).toBe("This is a ...");
    });

    it("should not truncate short text", () => {
      expect(truncateText("Short", 10)).toBe("Short");
    });
  });

  describe("toTitleCase", () => {
    it("should convert to title case", () => {
      expect(toTitleCase("hello world")).toBe("Hello World");
      expect(toTitleCase("HELLO WORLD")).toBe("Hello World");
    });
  });

  describe("toSlug", () => {
    it("should convert text to slug", () => {
      expect(toSlug("Hello World")).toBe("hello-world");
      expect(toSlug("Product Name 123")).toBe("product-name-123");
    });

    it("should handle special characters", () => {
      expect(toSlug("Hello & World!")).toBe("hello-world");
      expect(toSlug("Multiple   Spaces")).toBe("multiple-spaces");
    });
  });
});

describe("Validation Utilities", () => {
  describe("isValidEmail", () => {
    it("should validate correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@example.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("should validate strong passwords", () => {
      expect(isValidPassword("Password123!")).toBe(true);
      expect(isValidPassword("MyP@ssw0rd")).toBe(true);
    });

    it("should reject weak passwords", () => {
      expect(isValidPassword("short")).toBe(false);
      expect(isValidPassword("noupperlower")).toBe(false);
      expect(isValidPassword("NoNumber!")).toBe(false);
    });
  });

  describe("isValidPhone", () => {
    it("should validate US phone numbers", () => {
      expect(isValidPhone("(555) 123-4567")).toBe(true);
      expect(isValidPhone("555-123-4567")).toBe(true);
      expect(isValidPhone("5551234567")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(isValidPhone("123")).toBe(false);
      expect(isValidPhone("abc-def-ghij")).toBe(false);
    });
  });

  describe("getPasswordStrength", () => {
    it("should return correct strength levels", () => {
      expect(getPasswordStrength("weak")).toBe("weak");
      expect(getPasswordStrength("Password1")).toBe("medium");
      expect(getPasswordStrength("P@ssw0rd!Strong")).toBe("strong");
    });
  });
});
