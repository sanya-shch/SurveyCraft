import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma.js";
import { AppError } from "../../shared/middleware/errorHandler.js";
import { UpdateFormInput, UserFormsDto } from "./form.types.js";
import { toJson } from "../../shared/utils/helpers.js";
import { validateConditionGraph } from "@surveycraft/condition-engine";

export const createForm = async ({
  title,
  description,
  userId,
}: {
  title: string;
  description?: string;
  userId: string;
}) => {
  return prisma.form.create({
    data: {
      title,
      description,
      userId,
    },
  });
};

export const getUserForms = async (userId: string): Promise<UserFormsDto> => {
  return prisma.form.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          questions: true,
          responses: true,
        },
      },
    },
  });
};

export const deleteForm = async (formId: string, userId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) {
    throw new AppError("Form not found", 404);
  }

  if (form.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  await prisma.form.delete({
    where: { id: formId },
  });
};

export const getUserForm = async (formId: string, userId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          responses: true,
        },
      },
    },
  });

  if (!form) {
    throw new AppError("Form not found", 404);
  }

  if (form.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  return form;
};

export const getFormByShareId = async (shareId: string) => {
  const form = await prisma.form.findUnique({
    where: { shareId },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!form || !form.isPublished) {
    throw new AppError("Form not available", 404);
  }

  return {
    id: form.id,
    title: form.title,
    description: form.description,
    questions: form.questions,
  };
};

export const updateForm = async (formId: string, userId: string, data: UpdateFormInput) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError("Form not found", 404);
  if (form.userId !== userId) throw new AppError("Forbidden", 403);

  const existingQuestions = form.questions;
  const incomingQuestions = data.questions;

  const existingIds = new Set(existingQuestions.map((q) => q.id));

  // Питанням без клієнтського id призначаємо його самі до валідації графа,
  // щоб condition інших питань могли на них посилатись і щоб id, який ми
  // валідували, збігався з тим, що реально запишеться в БД.
  const withResolvedIds = incomingQuestions.map((q: any) =>
    !q.id || !existingIds.has(q.id) ? { ...q, id: q.id ?? crypto.randomUUID() } : q,
  );

  const graphValidation = validateConditionGraph(
    withResolvedIds.map((q: any) => ({ id: q.id, order: q.order, condition: q.condition })),
  );

  if (!graphValidation.valid) {
    throw new AppError(
      `Некоректні умови показу питань: ${graphValidation.errors.map((e) => e.detail).join("; ")}`,
      400,
    );
  }

  const incomingIds = new Set(withResolvedIds.map((q: any) => q.id));
  const toDelete = existingQuestions.filter((q) => !incomingIds.has(q.id)).map((q) => q.id);

  return prisma.$transaction(async (tx) => {
    await tx.form.update({
      where: { id: formId },
      data: {
        title: data.title,
        description: data.description,
        updatedAt: new Date(),
      },
    });

    if (toDelete.length) {
      await tx.question.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    const resolvedToUpdate = withResolvedIds.filter((q: any) => existingIds.has(q.id));
    const resolvedToCreate = withResolvedIds.filter((q: any) => !existingIds.has(q.id));

    for (const q of resolvedToUpdate) {
      await tx.question.update({
        where: { id: q.id },
        data: {
          text: q.text,
          description: q.description,
          type: q.type,
          required: q.required ?? false,
          order: q.order,
          options: "options" in q ? toJson(q.options) : undefined,
          config: "config" in q ? toJson(q.config) : undefined,
          condition: q.condition === undefined ? undefined : toJson(q.condition),
        },
      });
    }

    if (resolvedToCreate.length) {
      await tx.question.createMany({
        data: resolvedToCreate.map((q: any) => ({
          id: q.id,
          text: q.text,
          description: q.description,
          type: q.type,
          required: q.required ?? false,
          order: q.order,
          options: "options" in q ? toJson(q.options) : undefined,
          config: "config" in q ? toJson(q.config) : undefined,
          condition: q.condition == null ? undefined : toJson(q.condition),
          formId,
        })),
      });
    }

    return { success: true };
  });
};

export const publishForm = async (formId: string, userId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) throw new AppError("Form not found", 404);
  if (form.userId !== userId) throw new AppError("Forbidden", 403);

  return prisma.form.update({
    where: { id: formId },
    data: { isPublished: true },
  });
};

export const unpublishForm = async (formId: string, userId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) throw new AppError("Form not found", 404);
  if (form.userId !== userId) throw new AppError("Forbidden", 403);

  return prisma.form.update({
    where: { id: formId },
    data: { isPublished: false },
  });
};

export const duplicateForm = async (formId: string, userId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError("Form not found", 404);

  return prisma.$transaction(async (tx) => {
    const newForm = await tx.form.create({
      data: {
        title: form.title + " (Copy)",
        description: form.description,
        userId,
        isPublished: false,
      },
    });

    // Копії питань отримують нові id (старі вже зайняті оригіналом), тому
    // condition.rules[].questionId треба ремапнути на нові id - інакше умови
    // в дублікаті посилатимуться на питання іншої (оригінальної) форми.
    const idMap = new Map(form.questions.map((q) => [q.id, crypto.randomUUID()]));

    const remapCondition = (condition: unknown): Prisma.InputJsonValue | undefined => {
      if (!condition || typeof condition !== "object") return undefined;
      const c = condition as {
        logic: "AND" | "OR";
        rules: { questionId: string; operator: string; value: unknown }[];
      };
      return {
        logic: c.logic,
        rules: c.rules.map((r) => ({ ...r, questionId: idMap.get(r.questionId) ?? r.questionId })),
      } as Prisma.InputJsonValue;
    };

    await tx.question.createMany({
      data: form.questions.map((q) => ({
        id: idMap.get(q.id),
        text: q.text,
        description: q.description,
        type: q.type,
        required: q.required,
        order: q.order,
        options: Array.isArray(q.options) ? (q.options as Prisma.InputJsonValue) : [],
        config: q.config as Prisma.InputJsonValue,
        condition: remapCondition(q.condition),
        formId: newForm.id,
      })),
    });

    return newForm;
  });
};
