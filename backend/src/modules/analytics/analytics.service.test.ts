import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = await import("../../prisma/prisma.js");
const { getFormAnalytics, getQuestionAnalytics, getResponses, getResponseById } =
  await import("./analytics.service.js");

vi.mock("../../prisma/prisma.js", () => ({
  prisma: {
    form: { findUnique: vi.fn() },
    response: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

const OWNER_ID = "user-owner";
const OTHER_USER_ID = "user-other";
const FORM_ID = "form-1";

const choiceOptions = [
  { id: "opt-a", text: "Варіант А" },
  { id: "opt-b", text: "Варіант Б" },
];

const questions = [
  { id: "q-text", type: "TEXT", text: "Ім'я", description: null, options: null },
  { id: "q-number", type: "NUMBER", text: "Вік", description: null, options: null },
  { id: "q-bool", type: "BOOLEAN", text: "Згода", description: null, options: null },
  {
    id: "q-single",
    type: "CHOICE_SINGLE",
    text: "Колір",
    description: null,
    options: choiceOptions,
  },
  {
    id: "q-multi",
    type: "CHOICE_MULTI",
    text: "Мови",
    description: null,
    options: choiceOptions,
  },
];

const mockForm = (overrides: Record<string, unknown> = {}) => ({
  id: FORM_ID,
  userId: OWNER_ID,
  questions,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getFormAnalytics", () => {
  it("кидає 404/403 за ownership-перевіркою", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(null);
    await expect(getFormAnalytics(FORM_ID, OWNER_ID)).rejects.toMatchObject({
      statusCode: 404,
    });

    (prisma.form.findUnique as any).mockResolvedValue(mockForm());
    await expect(getFormAnalytics(FORM_ID, OTHER_USER_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("TEXT: показує топ-5 найпопулярніших відповідей за спаданням частоти", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[0]] }));
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-text": "Київ" } },
      { answers: { "q-text": "Київ" } },
      { answers: { "q-text": "Львів" } },
    ]);

    const result = await getFormAnalytics(FORM_ID, OWNER_ID);
    const q = result.questions[0] as any;

    expect(result.totalResponses).toBe(3);
    expect(q.preview[0]).toEqual({ value: "Київ", count: 2 });
    expect(q.preview[1]).toEqual({ value: "Львів", count: 1 });
  });

  it("NUMBER: рахує avg/min/max по наявних відповідях", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[1]] }));
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-number": 10 } },
      { answers: { "q-number": 20 } },
      { answers: { "q-number": 30 } },
    ]);

    const result = await getFormAnalytics(FORM_ID, OWNER_ID);
    const q = result.questions[0] as any;

    expect(q.stats).toEqual({ avg: 20, min: 10, max: 30 });
  });

  it("NUMBER: без жодної відповіді дає нульову статистику (не NaN/Infinity)", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[1]] }));
    (prisma.response.findMany as any).mockResolvedValue([]);

    const result = await getFormAnalytics(FORM_ID, OWNER_ID);
    const q = result.questions[0] as any;

    expect(q.stats).toEqual({ avg: 0, min: 0, max: 0 });
  });

  it("BOOLEAN: рахує trueCount/falseCount", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[2]] }));
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-bool": true } },
      { answers: { "q-bool": true } },
      { answers: { "q-bool": false } },
    ]);

    const result = await getFormAnalytics(FORM_ID, OWNER_ID);
    const q = result.questions[0] as any;

    expect(q.trueCount).toBe(2);
    expect(q.falseCount).toBe(1);
  });

  it("CHOICE_SINGLE: розподіл по всіх options, включно з нульовими", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[3]] }));
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-single": "opt-a" } },
      { answers: { "q-single": "opt-a" } },
    ]);

    const result = await getFormAnalytics(FORM_ID, OWNER_ID);
    const q = result.questions[0] as any;

    expect(q.distribution).toEqual([
      { optionId: "opt-a", text: "Варіант А", count: 2 },
      { optionId: "opt-b", text: "Варіант Б", count: 0 },
    ]);
  });

  it("CHOICE_MULTI: рахує кожен обраний варіант окремо з масиву", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[4]] }));
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-multi": ["opt-a", "opt-b"] } },
      { answers: { "q-multi": ["opt-a"] } },
    ]);

    const result = await getFormAnalytics(FORM_ID, OWNER_ID);
    const q = result.questions[0] as any;

    expect(q.distribution).toEqual([
      { optionId: "opt-a", text: "Варіант А", count: 2 },
      { optionId: "opt-b", text: "Варіант Б", count: 1 },
    ]);
  });

  it("ігнорує відповіді на видалені/невідомі опції, а не падає", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[3]] }));
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-single": "opt-deleted" } },
    ]);

    const result = await getFormAnalytics(FORM_ID, OWNER_ID);
    const q = result.questions[0] as any;

    expect(q.distribution.every((d: any) => d.count === 0)).toBe(true);
  });
});

describe("getQuestionAnalytics", () => {
  it("кидає 404, якщо питання не знайдено у формі", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm());

    await expect(getQuestionAnalytics(FORM_ID, "q-nonexistent", OWNER_ID)).rejects.toMatchObject({
      statusCode: 404,
      message: "Question not found",
    });
  });

  it("TEXT: повертає розподіл значень і сирий список відповідей", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm());
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-text": "Київ" } },
      { answers: { "q-text": "Київ" } },
    ]);

    const result = (await getQuestionAnalytics(FORM_ID, "q-text", OWNER_ID)) as any;

    expect(result.totalAnswers).toBe(2);
    expect(result.distribution).toEqual([{ value: "Київ", count: 2 }]);
    expect(result.answers).toEqual(["Київ", "Київ"]);
  });

  it("NUMBER: рахує stats і розподіл за значеннями", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm());
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-number": 5 } },
      { answers: { "q-number": 15 } },
    ]);

    const result = (await getQuestionAnalytics(FORM_ID, "q-number", OWNER_ID)) as any;

    expect(result.stats).toEqual({ avg: 10, min: 5, max: 15 });
  });

  it("CHOICE_MULTI: агрегує count по кожному id з усіх масивів", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm());
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-multi": ["opt-a", "opt-b"] } },
    ]);

    const result = (await getQuestionAnalytics(FORM_ID, "q-multi", OWNER_ID)) as any;

    expect(result.distribution).toEqual(
      expect.arrayContaining([
        { optionId: "opt-a", text: "Варіант А", count: 1 },
        { optionId: "opt-b", text: "Варіант Б", count: 1 },
      ]),
    );
  });

  it("BOOLEAN: рахує trueCount/falseCount", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm());
    (prisma.response.findMany as any).mockResolvedValue([
      { answers: { "q-bool": true } },
      { answers: { "q-bool": false } },
      { answers: { "q-bool": false } },
    ]);

    const result = (await getQuestionAnalytics(FORM_ID, "q-bool", OWNER_ID)) as any;

    expect(result.trueCount).toBe(1);
    expect(result.falseCount).toBe(2);
  });
});

describe("getResponses", () => {
  it("кидає 404/403 за ownership", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(null);
    await expect(getResponses(FORM_ID, OWNER_ID)).rejects.toMatchObject({
      statusCode: 404,
    });

    (prisma.form.findUnique as any).mockResolvedValue(mockForm());
    await expect(getResponses(FORM_ID, OTHER_USER_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("рахує skip за page/limit і повертає total разом зі сторінкою", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm());
    (prisma.response.count as any).mockResolvedValue(25);
    (prisma.response.findMany as any).mockResolvedValue([{ id: "r-1" }]);

    const result = await getResponses(FORM_ID, OWNER_ID, 3, 10);

    expect(prisma.response.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
    expect(result).toEqual({ total: 25, page: 3, limit: 10, data: [{ id: "r-1" }] });
  });

  it("використовує дефолтні page=1/limit=10, коли не передано", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm());
    (prisma.response.count as any).mockResolvedValue(0);
    (prisma.response.findMany as any).mockResolvedValue([]);

    await getResponses(FORM_ID, OWNER_ID);

    expect(prisma.response.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
  });
});

describe("getResponseById", () => {
  it("кидає 404, якщо відповідь не знайдено або належить іншій формі", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm());
    (prisma.response.findUnique as any).mockResolvedValue(null);

    await expect(getResponseById(FORM_ID, "resp-x", OWNER_ID)).rejects.toMatchObject({
      statusCode: 404,
    });

    (prisma.response.findUnique as any).mockResolvedValue({
      id: "resp-x",
      formId: "other-form",
    });
    await expect(getResponseById(FORM_ID, "resp-x", OWNER_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("збагачує CHOICE_SINGLE відповідь текстом опції", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[3]] }));
    (prisma.response.findUnique as any).mockResolvedValue({
      id: "resp-1",
      formId: FORM_ID,
      createdAt: new Date("2026-01-01"),
      answers: { "q-single": "opt-b" },
    });

    const result = await getResponseById(FORM_ID, "resp-1", OWNER_ID);

    expect(result.answers).toEqual([
      expect.objectContaining({
        questionId: "q-single",
        displayValue: "Варіант Б",
        rawValue: "opt-b",
      }),
    ]);
  });

  it("позначає видалену опцію CHOICE_SINGLE окремим текстом замість падіння", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[3]] }));
    (prisma.response.findUnique as any).mockResolvedValue({
      id: "resp-1",
      formId: FORM_ID,
      createdAt: new Date("2026-01-01"),
      answers: { "q-single": "opt-deleted" },
    });

    const result = await getResponseById(FORM_ID, "resp-1", OWNER_ID);

    expect(result.answers[0].displayValue as string).toContain("Опція видалена");
  });

  it('BOOLEAN відображається як "Так"/"Ні"', async () => {
    (prisma.form.findUnique as any).mockResolvedValue(mockForm({ questions: [questions[2]] }));
    (prisma.response.findUnique as any).mockResolvedValue({
      id: "resp-1",
      formId: FORM_ID,
      createdAt: new Date("2026-01-01"),
      answers: { "q-bool": true },
    });

    const result = await getResponseById(FORM_ID, "resp-1", OWNER_ID);

    expect(result.answers[0].displayValue).toBe("Так");
  });

  it("пропускає питання без відповіді (null/undefined), не додаючи їх у результат", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(
      mockForm({ questions: [questions[0], questions[2]] }),
    );
    (prisma.response.findUnique as any).mockResolvedValue({
      id: "resp-1",
      formId: FORM_ID,
      createdAt: new Date("2026-01-01"),
      answers: { "q-bool": true },
    });

    const result = await getResponseById(FORM_ID, "resp-1", OWNER_ID);

    expect(result.answers).toHaveLength(1);
    expect(result.answers[0].questionId).toBe("q-bool");
  });
});
