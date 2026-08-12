import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schema.js";

describe.each([
  ["registerSchema", registerSchema],
  ["loginSchema", loginSchema],
] as const)("%s", (_name, schema) => {
  it("приймає валідний email і пароль від 6 символів", () => {
    expect(schema.safeParse({ email: "a@b.com", password: "123456" }).success).toBe(true);
  });

  it("відхиляє невалідний email", () => {
    expect(schema.safeParse({ email: "not-an-email", password: "123456" }).success).toBe(false);
  });

  it("відхиляє закороткий пароль (<6 символів)", () => {
    expect(schema.safeParse({ email: "a@b.com", password: "12345" }).success).toBe(false);
  });

  it("відхиляє відсутні поля", () => {
    expect(schema.safeParse({}).success).toBe(false);
  });
});
