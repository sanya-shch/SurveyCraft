import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../prisma/prisma.js", () => ({
  prisma: {
    form: { findUnique: vi.fn() },
    response: { create: vi.fn() },
  },
}));

const { prisma } = await import("../../prisma/prisma.js");
const { submitResponse } = await import("./response.service.js");

const SHARE_ID = "share-1";

const publishedForm = {
  id: "form-1",
  isPublished: true,
  questions: [
    {
      id: "q-name",
      type: "TEXT",
      text: "Ім'я",
      required: true,
      order: 0,
      options: [],
      config: null,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitResponse", () => {
  it("кидає 404, якщо форми з таким shareId не існує", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(null);

    await expect(submitResponse(SHARE_ID, {})).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prisma.response.create).not.toHaveBeenCalled();
  });

  it("кидає 400, якщо форма ще не опублікована", async () => {
    (prisma.form.findUnique as any).mockResolvedValue({
      ...publishedForm,
      isPublished: false,
    });

    await expect(submitResponse(SHARE_ID, {})).rejects.toMatchObject({
      statusCode: 400,
      message: "Form is not published",
    });
  });

  it("кидає 400 з детальними помилками поля при невалідних answers", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(publishedForm);

    await expect(submitResponse(SHARE_ID, { "q-name": "" })).rejects.toMatchObject({
      statusCode: 400,
      message: "Validation failed",
      errors: [{ field: "q-name", message: expect.any(String) }],
    });
    expect(prisma.response.create).not.toHaveBeenCalled();
  });

  it("зберігає валідну відповідь і повертає створений запис", async () => {
    (prisma.form.findUnique as any).mockResolvedValue(publishedForm);
    (prisma.response.create as any).mockResolvedValue({
      id: "resp-1",
      formId: "form-1",
      answers: { "q-name": "Олександр" },
    });

    const result = await submitResponse(SHARE_ID, { "q-name": "Олександр" });

    expect(prisma.response.create).toHaveBeenCalledWith({
      data: { formId: "form-1", answers: { "q-name": "Олександр" } },
    });
    expect(result.id).toBe("resp-1");
  });
});
