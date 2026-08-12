import { describe, expect, it } from "vitest";
import { submitResponseSchema } from "./response.schema.js";

describe("submitResponseSchema", () => {
  it("приймає answers з рядками/числами/булевими/масивами рядків", () => {
    const result = submitResponseSchema.safeParse({
      answers: { a: "text", b: 42, c: true, d: ["x", "y"] },
    });

    expect(result.success).toBe(true);
  });

  it("відхиляє answers, якщо це не об'єкт", () => {
    const result = submitResponseSchema.safeParse({ answers: "not-an-object" });

    expect(result.success).toBe(false);
  });

  it("відхиляє значення непідтримуваного типу (наприклад, вкладений об'єкт)", () => {
    const result = submitResponseSchema.safeParse({
      answers: { a: { nested: true } },
    });

    expect(result.success).toBe(false);
  });

  it("порожній об'єкт answers валідний (перевірка обов'язковості — відповідальність buildResponseSchema)", () => {
    const result = submitResponseSchema.safeParse({ answers: {} });

    expect(result.success).toBe(true);
  });
});
