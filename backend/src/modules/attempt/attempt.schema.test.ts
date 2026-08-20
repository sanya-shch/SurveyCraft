import { describe, expect, it } from "vitest";
import { saveAttemptSchema } from "./attempt.schema.js";

describe("saveAttemptSchema", () => {
  it("валідний payload з sessionKey і answers проходить", () => {
    const result = saveAttemptSchema.safeParse({
      sessionKey: "session-abc-123",
      answers: { "q-1": "текст", "q-2": 42, "q-3": true, "q-4": ["a", "b"] },
    });
    expect(result.success).toBe(true);
  });

  it("порожні answers валідні (початковий autosave до будь-якого вводу)", () => {
    const result = saveAttemptSchema.safeParse({ sessionKey: "session-1", answers: {} });
    expect(result.success).toBe(true);
  });

  it("відхиляє порожній sessionKey", () => {
    const result = saveAttemptSchema.safeParse({ sessionKey: "", answers: {} });
    expect(result.success).toBe(false);
  });

  it("відхиляє відсутній sessionKey", () => {
    const result = saveAttemptSchema.safeParse({ answers: {} });
    expect(result.success).toBe(false);
  });

  it("відхиляє sessionKey довше 100 символів", () => {
    const result = saveAttemptSchema.safeParse({ sessionKey: "x".repeat(101), answers: {} });
    expect(result.success).toBe(false);
  });

  it("відхиляє answer недопустимого типу (об'єкт)", () => {
    const result = saveAttemptSchema.safeParse({
      sessionKey: "session-1",
      answers: { "q-1": { nested: "object" } },
    });
    expect(result.success).toBe(false);
  });
});
