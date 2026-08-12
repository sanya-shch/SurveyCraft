import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma.js";
import { AppError } from "../../shared/middleware/errorHandler.js";
import { UpdateFormInput, UserFormsDto } from "./form.types.js";
import { toJson } from "../../shared/utils/helpers.js";

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

  // const existingMap = new Map(existingQuestions.map((q) => [q.id, q]));

  const incomingIds = new Set(incomingQuestions.filter((q: any) => q.id).map((q: any) => q.id));

  const toDelete = existingQuestions.filter((q) => !incomingIds.has(q.id)).map((q) => q.id);

  const toUpdate = incomingQuestions.filter((q: any) => q.id);

  const toCreate = incomingQuestions.filter((q: any) => !q.id);

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

    for (const q of toUpdate) {
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
        },
      });
    }

    if (toCreate.length) {
      await tx.question.createMany({
        data: toCreate.map((q: any) => ({
          text: q.text,
          description: q.description,
          type: q.type,
          required: q.required ?? false,
          order: q.order,
          options: "options" in q ? toJson(q.options) : undefined,
          config: "config" in q ? toJson(q.config) : undefined,
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

    await tx.question.createMany({
      data: form.questions.map((q) => ({
        text: q.text,
        description: q.description,
        type: q.type,
        required: q.required,
        order: q.order,
        options: Array.isArray(q.options) ? (q.options as Prisma.InputJsonValue) : [],
        config: q.config as Prisma.InputJsonValue,
        formId: newForm.id,
      })),
    });

    return newForm;
  });
};
