import { prisma } from '../../prisma/prisma.js';
import { buildResponseSchema } from './response.validation.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Answers } from './response.types.js';

export const submitResponse = async (shareId: string, answers: Answers) => {
  const form = await prisma.form.findUnique({
    where: { shareId },
    include: {
      questions: true,
    },
  });

  if (!form) {
    throw new AppError('Form not found', 404);
  }

  if (!form.isPublished) {
    throw new AppError('Form is not published', 400);
  }

  const schema = buildResponseSchema(form.questions);

  const result = schema.safeParse(answers);

  if (!result.success) {
    const formattedErrors = result.error.issues.map((err) => ({
      field: err.path[0],
      message: err.message,
    }));

    throw new AppError('Validation failed', 400, formattedErrors);
  }

  return prisma.response.create({
    data: {
      formId: form.id,
      answers: result.data as Answers,
    },
  });
};
