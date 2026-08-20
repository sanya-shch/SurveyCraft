import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../prisma/prisma.js", () => ({
  prisma: {
    form: { findUnique: vi.fn() },
    responseAttempt: { upsert: vi.fn() },
  },
}));

const { prisma } = await import("../../prisma/prisma.js");
const { saveAttempt } = await import("./attempt.service.js");

const SHARE_ID = "share-1";

const publishedForm = {
  id: "form-1",
  isPublished: true,
  questions: [
    { id: "q-1", type: "TEXT", text: "Ім'я", required: true, order: 0, options: [], config: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveAttempt", () => {
  it("кидає 404, якщо форми з таким shareId не існує", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(null);

    await expect(saveAttempt(SHARE_ID, "session-1", {})).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prisma.responseAttempt.upsert).not.toHaveBeenCalled();
  });

  it("кидає 400, якщо форма ще не опублікована", async () => {
    (prisma.form.findUnique as any).mockResolvedValue({ ...publishedForm, isPublished: false });

    await expect(saveAttempt(SHARE_ID, "session-1", {})).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("НЕ вимагає required-поля - часткові/порожні answers приймаються (це чернетка, не фінальний сабміт)", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(publishedForm);
    (prisma.responseAttempt.upsert as any).mockResolvedValue({
      id: "attempt-1",
      updatedAt: new Date("2026-01-01"),
    });

    // required-поле q-1 не заповнене - не мало б кинути помилку
    const result = await saveAttempt(SHARE_ID, "session-1", {});

    expect(result.id).toBe("attempt-1");
  });

  it("upsert по (formId, sessionKey) з answers і visibleQuestionIds", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(publishedForm);
    (prisma.responseAttempt.upsert as any).mockResolvedValue({
      id: "attempt-1",
      updatedAt: new Date(),
    });

    await saveAttempt(SHARE_ID, "session-1", { "q-1": "Олександр" });

    expect(prisma.responseAttempt.upsert).toHaveBeenCalledWith({
      where: { formId_sessionKey: { formId: "form-1", sessionKey: "session-1" } },
      create: {
        formId: "form-1",
        sessionKey: "session-1",
        answers: { "q-1": "Олександр" },
        visibleQuestionIds: ["q-1"],
      },
      update: {
        answers: { "q-1": "Олександр" },
        visibleQuestionIds: ["q-1"],
      },
    });
  });

  it("вирізає answer для питання, прихованого умовою (той самий принцип, що й submitResponse)", async () => {
    const formWithCondition = {
      ...publishedForm,
      questions: [
        publishedForm.questions[0],
        {
          id: "q-2",
          type: "TEXT",
          text: "Уточнення",
          required: false,
          order: 1,
          options: [],
          config: null,
          condition: {
            logic: "AND",
            rules: [{ questionId: "q-1", operator: "equals", value: "тригер" }],
          },
        },
      ],
    };
    (prisma.form.findUnique as any).mockResolvedValue(formWithCondition);
    (prisma.responseAttempt.upsert as any).mockResolvedValue({
      id: "attempt-1",
      updatedAt: new Date(),
    });

    // q-1 != "тригер" => q-2 приховане, значення для нього має бути вирізане
    await saveAttempt(SHARE_ID, "session-1", { "q-1": "не тригер", "q-2": "непрохане значення" });

    const call = (prisma.responseAttempt.upsert as any).mock.calls[0][0];
    expect(call.create.answers).toEqual({ "q-1": "не тригер" });
    expect(call.create.visibleQuestionIds).toEqual(["q-1"]);
  });

  it("умовне питання ПОКАЗАНЕ, коли тригер виконано - потрапляє у visibleQuestionIds", async () => {
    const formWithCondition = {
      ...publishedForm,
      questions: [
        publishedForm.questions[0],
        {
          id: "q-2",
          type: "TEXT",
          text: "Уточнення",
          required: false,
          order: 1,
          options: [],
          config: null,
          condition: {
            logic: "AND",
            rules: [{ questionId: "q-1", operator: "equals", value: "тригер" }],
          },
        },
      ],
    };
    (prisma.form.findUnique as any).mockResolvedValue(formWithCondition);
    (prisma.responseAttempt.upsert as any).mockResolvedValue({
      id: "attempt-1",
      updatedAt: new Date(),
    });

    await saveAttempt(SHARE_ID, "session-1", { "q-1": "тригер" });

    const call = (prisma.responseAttempt.upsert as any).mock.calls[0][0];
    expect(call.create.visibleQuestionIds).toEqual(["q-1", "q-2"]);
  });
});
