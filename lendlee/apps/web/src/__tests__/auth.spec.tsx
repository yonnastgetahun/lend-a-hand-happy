import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/schemas/auth";

describe("Authentication", () => {
  describe("Login Schema Validation", () => {
    it("shows error for invalid email", () => {
      const result = loginSchema.safeParse({ email: "invalid", password: "password123" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Please enter a valid email");
      }
    });

    it("shows error for short password", () => {
      const result = loginSchema.safeParse({ email: "test@example.com", password: "123" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Password must be at least 6 characters");
      }
    });

    it("shows error for empty email", () => {
      const result = loginSchema.safeParse({ email: "", password: "password123" });
      expect(result.success).toBe(false);
    });

    it("shows error for empty password", () => {
      const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
      expect(result.success).toBe(false);
    });

    it("shows error for empty fields", () => {
      const result = loginSchema.safeParse({ email: "", password: "" });
      expect(result.success).toBe(false);
    });

    it("passes with valid credentials", () => {
      const result = loginSchema.safeParse({ email: "test@example.com", password: "password123" });
      expect(result.success).toBe(true);
    });
  });

  describe("Register Schema Validation", () => {
    it("requires name field", () => {
      const result = registerSchema.safeParse({ 
        name: "", 
        email: "test@example.com", 
        password: "password123",
        confirmPassword: "password123"
      });
      expect(result.success).toBe(false);
    });

    it("requires matching passwords", () => {
      const result = registerSchema.safeParse({ 
        name: "Test User",
        email: "test@example.com", 
        password: "password123",
        confirmPassword: "different"
      });
      expect(result.success).toBe(false);
    });

    it("passes with valid registration data", () => {
      const result = registerSchema.safeParse({ 
        name: "Test User",
        email: "test@example.com", 
        password: "password123",
        confirmPassword: "password123"
      });
      expect(result.success).toBe(true);
    });
  });
});
