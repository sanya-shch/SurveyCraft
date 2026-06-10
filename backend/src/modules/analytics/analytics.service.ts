import { prisma } from '../../prisma/prisma.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Answers } from '../response/response.types.js';
import {
  EnrichedAnswer,
  FormAnalyticsDto,
  QuestionAnalyticsDto,
  QuestionOverview,
  ResponseDetailsDto,
  ResponseListDto,
} from './analytics.types.js';

export const getFormAnalytics = async (
  formId: string,
  userId: string
): Promise<FormAnalyticsDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError('Form not found', 404);
  if (form.userId !== userId) throw new AppError('Forbidden', 403);

  const responses = await prisma.response.findMany({
    where: { formId },
    select: { answers: true },
  });

  const totalResponses = responses.length;

  const parsed = responses.map((r) => r.answers as Answers);

  const questions: QuestionOverview[] = [];

  for (const q of form.questions) {
    const values = parsed.map((a) => a[q.id]).filter((v) => v !== undefined);

    if (q.type === 'TEXT' || q.type === 'DATE') {
      const map: Record<string, number> = {};

      for (const val of values as string[]) {
        map[val] = (map[val] || 0) + 1;
      }

      const preview = Object.entries(map)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      questions.push({
        id: q.id,
        text: q.text,
        type: q.type,
        preview,
      });
    } else if (q.type === 'NUMBER') {
      const nums = values as number[];

      if (!nums.length) {
        questions.push({
          id: q.id,
          text: q.text,
          type: 'NUMBER',
          stats: { avg: 0, min: 0, max: 0 },
        });
        continue;
      }

      questions.push({
        id: q.id,
        text: q.text,
        type: 'NUMBER',
        stats: {
          avg: nums.reduce((a, b) => a + b, 0) / nums.length,
          min: Math.min(...nums),
          max: Math.max(...nums),
        },
      });
    } else if (q.type === 'CHOICE_SINGLE' || q.type === 'CHOICE_MULTI') {
      const options = (q.options as { id: string; text: string }[]) ?? [];

      const distribution: Record<string, number> = {};

      for (const option of options) {
        distribution[option.id] = 0;
      }

      for (const response of responses) {
        const answer = (response.answers as Answers)?.[q.id];

        if (!answer) continue;

        if (q.type === 'CHOICE_SINGLE') {
          if (
            typeof answer === 'string' &&
            distribution[answer] !== undefined
          ) {
            distribution[answer]++;
          }
        }

        if (q.type === 'CHOICE_MULTI') {
          if (Array.isArray(answer)) {
            for (const val of answer) {
              if (distribution[val] !== undefined) {
                distribution[val]++;
              }
            }
          }
        }
      }

      questions.push({
        id: q.id,
        type: q.type,
        text: q.text,
        distribution: options.map((opt) => ({
          optionId: opt.id,
          text: opt.text,
          count: distribution[opt.id] ?? 0,
        })),
      });
    } else if (q.type === 'BOOLEAN') {
      const bools = values as boolean[];

      questions.push({
        id: q.id,
        type: 'BOOLEAN',
        text: q.text,
        trueCount: bools.filter((v) => v === true).length,
        falseCount: bools.filter((v) => v === false).length,
      });
    }
  }

  return {
    totalResponses,
    questions,
  };
};

export const getQuestionAnalytics = async (
  formId: string,
  questionId: string,
  userId: string
): Promise<QuestionAnalyticsDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError('Form not found', 404);
  if (form.userId !== userId) throw new AppError('Forbidden', 403);

  const question = form.questions.find((q) => q.id === questionId);

  if (!question) throw new AppError('Question not found', 404);

  const responses = await prisma.response.findMany({
    where: { formId },
  });

  const values = responses
    .map((r) => (r.answers as any)[questionId])
    .filter((v) => v !== undefined);

  const totalAnswers = values.length;

  if (question.type === 'TEXT' || question.type === 'DATE') {
    const map: Record<string, number> = {};

    for (const val of values as string[]) {
      map[val] = (map[val] || 0) + 1;
    }

    return {
      question: {
        id: question.id,
        text: question.text,
        description: question.description,
        type: question.type,
      },
      totalAnswers,
      distribution: Object.entries(map).map(([value, count]) => ({
        value,
        count,
      })),
      answers: values as string[],
    };
  }

  if (question.type === 'NUMBER') {
    const nums = values as number[];

    const map: Record<number, number> = {};
    for (const n of nums) {
      map[n] = (map[n] || 0) + 1;
    }

    return {
      question: {
        id: question.id,
        text: question.text,
        description: question.description,
        type: 'NUMBER',
      },
      totalAnswers,
      stats: {
        avg: nums.reduce((a, b) => a + b, 0) / nums.length || 0,
        min: Math.min(...nums),
        max: Math.max(...nums),
      },
      distribution: Object.entries(map).map(([value, count]) => ({
        value: Number(value),
        count,
      })),
    };
  }

  if (question.type === 'CHOICE_SINGLE' || question.type === 'CHOICE_MULTI') {
    const map: Record<string, number> = {};

    for (const val of values) {
      if (Array.isArray(val)) {
        for (const v of val) {
          map[v] = (map[v] || 0) + 1;
        }
      } else if (val) {
        map[val] = (map[val] || 0) + 1;
      }
    }

    const options = (question.options ?? []) as { id: string; text: string }[];

    const distribution = options.map((opt) => ({
      optionId: opt.id,
      text: opt.text,
      count: map[opt.id] || 0,
    }));

    return {
      question: {
        id: question.id,
        text: question.text,
        description: question.description,
        type: question.type,
      },
      totalAnswers,
      distribution,
    };
  }

  if (question.type === 'BOOLEAN') {
    const bools = values as boolean[];

    return {
      question: {
        id: question.id,
        text: question.text,
        description: question.description,
        type: 'BOOLEAN',
      },
      totalAnswers,
      trueCount: bools.filter(Boolean).length,
      falseCount: bools.filter((v) => !v).length,
    };
  }

  throw new AppError('Unsupported type', 400);
};

export const getResponses = async (
  formId: string,
  userId: string,
  page = 1,
  limit = 10
): Promise<ResponseListDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) throw new AppError('Form not found', 404);
  if (form.userId !== userId) throw new AppError('Forbidden', 403);

  const skip = (page - 1) * limit;

  const [total, responses] = await Promise.all([
    prisma.response.count({
      where: { formId },
    }),
    prisma.response.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        // answers: true,
      },
    }),
  ]);

  return {
    total,
    page,
    limit,
    data: responses,
  };
};

export const getResponseById = async (
  formId: string,
  responseId: string,
  userId: string
): Promise<ResponseDetailsDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError('Form not found', 404);
  if (form.userId !== userId) throw new AppError('Forbidden', 403);

  const response = await prisma.response.findUnique({
    where: { id: responseId },
  });

  if (!response || response.formId !== formId) {
    throw new AppError('Response not found', 404);
  }

  const rawAnswers = response.answers as Record<string, any>;
  const enrichedAnswers: EnrichedAnswer[] = [];

  for (const q of form.questions) {
    const userValue = rawAnswers[q.id];

    if (userValue === undefined || userValue === null) {
      continue;
    }

    let displayValue: string | number | string[] = '';

    if (q.type === 'CHOICE_SINGLE') {
      const option = (q.options as any[] | null)?.find(
        (o) => o.id === userValue
      );
      displayValue = option ? option.text : `Опція видалена (${userValue})`;
    } else if (q.type === 'CHOICE_MULTI') {
      const optionIds = userValue as string[];
      const options = q.options as any[];

      displayValue = optionIds.map((id) => {
        const opt = options?.find((o) => o.id === id);
        return opt ? opt.text : `Невідformattingована опція (${id})`;
      });
    } else if (q.type === 'BOOLEAN') {
      displayValue = userValue === true ? 'Так' : 'Ні';
    } else {
      displayValue = userValue;
    }

    enrichedAnswers.push({
      questionId: q.id,
      questionText: q.text || 'Питання без назви',
      questionDescription: q.description,
      questionType: q.type,
      questionRequired: q.required,
      displayValue,
      rawValue: userValue,
    });
  }

  return {
    id: response.id,
    formId: response.formId,
    createdAt: response.createdAt,
    answers: enrichedAnswers,
  };
};
