import { describe, it, expect } from "vitest";
import {
  validateField,
  getDefaultAnswer,
  validateAll,
  buildCleanedAnswers,
} from "./questionValidation";
import type { Question } from "../../types/formBuilder";

const baseQuestion = (overrides: Partial<Question>): Question => ({
  id: "q1",
  type: "TEXT",
  text: "Питання",
  required: false,
  order: 0,
  options: [],
  config: null,
  ...overrides,
});

describe("validateField", () => {
  it("вимагає значення для required-поля", () => {
    const q = baseQuestion({ required: true });
    expect(validateField(q, "")).toBe("Це поле є обов'язковим для заповнення");
  });

  it("необов'язкове порожнє поле - без помилки", () => {
    const q = baseQuestion({ required: false });
    expect(validateField(q, "")).toBeNull();
  });

  it("required CHOICE_MULTI: порожній масив вважається порожнім значенням", () => {
    const q = baseQuestion({ type: "CHOICE_MULTI", required: true });
    expect(validateField(q, [])).toBe("Це поле є обов'язковим для заповнення");
    expect(validateField(q, ["opt1"])).toBeNull();
  });

  it("NUMBER: перевіряє min/max з config", () => {
    const q = baseQuestion({ type: "NUMBER", config: { min: 10, max: 20 } });
    expect(validateField(q, 5)).toBe("Значення має бути не менше 10");
    expect(validateField(q, 25)).toBe("Значення має бути не більше 20");
    expect(validateField(q, 15)).toBeNull();
  });

  it("TEXT: перевіряє minLength/maxLength", () => {
    const q = baseQuestion({ type: "TEXT", config: { minLength: 3, maxLength: 5 } });
    expect(validateField(q, "ab")).toBe("Мінімальна кількість символів: 3");
    expect(validateField(q, "abcdef")).toBe("Максимальна кількість символів: 5");
    expect(validateField(q, "abc")).toBeNull();
  });

  it("TEXT email variant: відхиляє некоректний email", () => {
    const q = baseQuestion({ type: "TEXT", config: { variant: "email" } });
    expect(validateField(q, "not-an-email")).toBe("Введіть коректну електронну адресу");
    expect(validateField(q, "user@example.com")).toBeNull();
  });

  it("TEXT name variant: приймає українські літери й дефіс, відхиляє цифри", () => {
    const q = baseQuestion({ type: "TEXT", config: { variant: "name" } });
    expect(validateField(q, "Олександр-Петро")).toBeNull();
    expect(validateField(q, "Ivan123")).toBe("Ім'я може містити лише літери, пробіли або дефіси");
  });

  it("TEXT з кастомним pattern", () => {
    const q = baseQuestion({ type: "TEXT", config: { pattern: "^[0-9]{5}$" } });
    expect(validateField(q, "12345")).toBeNull();
    expect(validateField(q, "abc")).toBe("Невірний формат вводу");
  });

  it("значення обрізається перед перевіркою minLength (пробіли не рахуються)", () => {
    const q = baseQuestion({ type: "TEXT", config: { minLength: 3 } });
    expect(validateField(q, "  ab  ")).toBe("Мінімальна кількість символів: 3");
  });
});

describe("getDefaultAnswer", () => {
  it("BOOLEAN: бере defaultValue з config, інакше false", () => {
    expect(
      getDefaultAnswer(baseQuestion({ type: "BOOLEAN", config: { defaultValue: true } })),
    ).toBe(true);
    expect(getDefaultAnswer(baseQuestion({ type: "BOOLEAN", config: null }))).toBe(false);
  });

  it("CHOICE_SINGLE: бере опцію з isDefault, інакше порожній рядок", () => {
    const q = baseQuestion({
      type: "CHOICE_SINGLE",
      options: [
        { id: "a", text: "A", isDefault: false },
        { id: "b", text: "B", isDefault: true },
      ],
    });
    expect(getDefaultAnswer(q)).toBe("b");
    expect(getDefaultAnswer(baseQuestion({ type: "CHOICE_SINGLE", options: [] }))).toBe("");
  });

  it("CHOICE_MULTI: збирає всі опції з isDefault", () => {
    const q = baseQuestion({
      type: "CHOICE_MULTI",
      options: [
        { id: "a", text: "A", isDefault: true },
        { id: "b", text: "B", isDefault: false },
        { id: "c", text: "C", isDefault: true },
      ],
    });
    expect(getDefaultAnswer(q)).toEqual(["a", "c"]);
  });

  it("TEXT/NUMBER/DATE: завжди порожній рядок", () => {
    expect(getDefaultAnswer(baseQuestion({ type: "TEXT" }))).toBe("");
    expect(getDefaultAnswer(baseQuestion({ type: "NUMBER" }))).toBe("");
    expect(getDefaultAnswer(baseQuestion({ type: "DATE" }))).toBe("");
  });
});

describe("validateAll", () => {
  it("повертає мапу помилок тільки для питань, що не пройшли валідацію", () => {
    const questions = [
      baseQuestion({ id: "q1", required: true }),
      baseQuestion({ id: "q2", required: false }),
    ];
    const errors = validateAll(questions, { q1: "", q2: "" });
    expect(errors).toEqual({ q1: "Це поле є обов'язковим для заповнення" });
  });

  it("порожній список питань - порожня мапа помилок", () => {
    expect(validateAll([], {})).toEqual({});
  });

  it("використовує fallback-ключ q-{index}, якщо у питання немає id", () => {
    const questions = [baseQuestion({ id: undefined, required: true })];
    const errors = validateAll(questions, {});
    expect(errors).toEqual({ "q-0": "Це поле є обов'язковим для заповнення" });
  });
});

describe("buildCleanedAnswers", () => {
  it("пропускає порожні необов'язкові відповіді", () => {
    const questions = [
      baseQuestion({ id: "q1", required: false }),
      baseQuestion({ id: "q2", required: true }),
    ];
    const result = buildCleanedAnswers(questions, { q1: "", q2: "answer" });
    expect(result).toEqual({ q2: "answer" });
  });

  it("пропускає питання без id (не збережене питання)", () => {
    const questions = [baseQuestion({ id: undefined })];
    const result = buildCleanedAnswers(questions, {});
    expect(result).toEqual({});
  });

  it("лишає значення 0/false навіть якщо необов'язкове (не 'порожнє' по суті)", () => {
    const questions = [
      baseQuestion({ id: "q1", type: "NUMBER", required: false }),
      baseQuestion({ id: "q2", type: "BOOLEAN", required: false }),
    ];
    const result = buildCleanedAnswers(questions, { q1: 0, q2: false });
    expect(result).toEqual({ q1: 0, q2: false });
  });
});
