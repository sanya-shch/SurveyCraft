import { describe, expect, it } from "vitest";
import { createFormSchema, questionSchema, updateFormSchema } from "./form.schema.js";

describe("createFormSchema", () => {
  it("вимагає title від 3 символів", () => {
    expect(createFormSchema.safeParse({ title: "ab" }).success).toBe(false);
    expect(createFormSchema.safeParse({ title: "abc" }).success).toBe(true);
  });

  it("description необов'язковий", () => {
    expect(createFormSchema.safeParse({ title: "Форма" }).success).toBe(true);
  });
});

describe("questionSchema — discriminated union за type", () => {
  const base = { text: "Питання", order: 0 };

  it("TEXT валідний без options", () => {
    const result = questionSchema.safeParse({ ...base, type: "TEXT" });
    expect(result.success).toBe(true);
  });

  it("CHOICE_SINGLE вимагає хоча б одну опцію", () => {
    expect(questionSchema.safeParse({ ...base, type: "CHOICE_SINGLE", options: [] }).success).toBe(
      false,
    );

    expect(
      questionSchema.safeParse({
        ...base,
        type: "CHOICE_SINGLE",
        options: [{ id: "opt-1", text: "Варіант" }],
      }).success,
    ).toBe(true);
  });

  it("CHOICE_MULTI так само вимагає options", () => {
    expect(questionSchema.safeParse({ ...base, type: "CHOICE_MULTI", options: [] }).success).toBe(
      false,
    );
  });

  it("CHOICE_SINGLE без поля options взагалі — невалідний (поле обов'язкове для цього варіанту)", () => {
    const result = questionSchema.safeParse({ ...base, type: "CHOICE_SINGLE" });
    expect(result.success).toBe(false);
  });

  it("BOOLEAN/DATE/NUMBER валідні без options", () => {
    expect(questionSchema.safeParse({ ...base, type: "BOOLEAN" }).success).toBe(true);
    expect(questionSchema.safeParse({ ...base, type: "DATE" }).success).toBe(true);
    expect(questionSchema.safeParse({ ...base, type: "NUMBER" }).success).toBe(true);
  });

  it("невідомий type відхиляється дискримінатором", () => {
    const result = questionSchema.safeParse({ ...base, type: "UNKNOWN" });
    expect(result.success).toBe(false);
  });

  it("NUMBER з config.min/max валідний, з невалідним типом config — ні", () => {
    expect(
      questionSchema.safeParse({
        ...base,
        type: "NUMBER",
        config: { min: 0, max: 100 },
      }).success,
    ).toBe(true);

    expect(
      questionSchema.safeParse({
        ...base,
        type: "NUMBER",
        config: { min: "нуль" },
      }).success,
    ).toBe(false);
  });

  it("text обов'язковий і не може бути порожнім", () => {
    const result = questionSchema.safeParse({ type: "TEXT", text: "", order: 0 });
    expect(result.success).toBe(false);
  });

  it("condition необов'язковий, question валідний без нього", () => {
    expect(questionSchema.safeParse({ ...base, type: "TEXT" }).success).toBe(true);
  });

  it("condition приймає null (явне 'без умови' при оновленні)", () => {
    expect(questionSchema.safeParse({ ...base, type: "TEXT", condition: null }).success).toBe(true);
  });

  it("валідний condition з AND/OR і одним із операторів", () => {
    const result = questionSchema.safeParse({
      ...base,
      type: "TEXT",
      condition: {
        logic: "AND",
        rules: [{ questionId: "q1", operator: "equals", value: "yes" }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("condition з порожнім rules — невалідний", () => {
    const result = questionSchema.safeParse({
      ...base,
      type: "TEXT",
      condition: { logic: "AND", rules: [] },
    });
    expect(result.success).toBe(false);
  });

  it("condition з невідомим оператором — невалідний", () => {
    const result = questionSchema.safeParse({
      ...base,
      type: "TEXT",
      condition: { logic: "AND", rules: [{ questionId: "q1", operator: "startsWith", value: "y" }] },
    });
    expect(result.success).toBe(false);
  });
});

describe("updateFormSchema", () => {
  it("приймає форму з масивом валідних питань", () => {
    const result = updateFormSchema.safeParse({
      title: "Моя форма",
      questions: [{ type: "TEXT", text: "Ім'я", order: 0 }],
    });

    expect(result.success).toBe(true);
  });

  it("відхиляє, якщо хоч одне питання невалідне", () => {
    const result = updateFormSchema.safeParse({
      title: "Моя форма",
      questions: [
        { type: "TEXT", text: "Ім'я", order: 0 },
        { type: "CHOICE_SINGLE", text: "Колір", order: 1, options: [] },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("порожній масив questions валідний (форма без питань)", () => {
    const result = updateFormSchema.safeParse({ title: "Порожня форма", questions: [] });

    expect(result.success).toBe(true);
  });
});
