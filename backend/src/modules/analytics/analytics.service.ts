import { prisma } from "../../prisma/prisma.js";
import { AppError } from "../../shared/middleware/errorHandler.js";
import { Answers } from "../response/response.types.js";
import {
  EnrichedAnswer,
  FormAnalyticsDto,
  FormFunnelDto,
  FormPathsDto,
  QuestionAnalyticsDto,
  QuestionFunnelNode,
  QuestionOverview,
  QuestionPathEdge,
  QuestionPathNode,
  ResponseDetailsDto,
  ResponseListDto,
} from "./analytics.types.js";

/**
 * visibleQuestionIds персистується лише для відповідей, надісланих після
 * впровадження conditional logic (Етап 2). Для старих відповідей (Json-поле
 * порожнє/null) - чесний fallback: вважаємо видимим кожне питання, на яке є
 * відповідь у answers (те, що й так робила аналітика до цієї фічі), тому
 * старі дані не "ламаються" заднім числом, а просто не мають точного
 * розрізнення "приховано" vs "показано, але пропущено".
 */
const resolveVisibleIdsForResponse = (
  response: { answers: unknown; visibleQuestionIds: unknown },
  allQuestionIds: string[],
): Set<string> => {
  if (Array.isArray(response.visibleQuestionIds)) {
    return new Set(response.visibleQuestionIds as string[]);
  }
  const answers = response.answers as Answers;
  return new Set(allQuestionIds.filter((id) => answers?.[id] !== undefined));
};

export const getFormAnalytics = async (
  formId: string,
  userId: string,
): Promise<FormAnalyticsDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError("Form not found", 404);
  if (form.userId !== userId) throw new AppError("Forbidden", 403);

  const responses = await prisma.response.findMany({
    where: { formId },
    select: { answers: true, visibleQuestionIds: true },
  });

  const totalResponses = responses.length;

  const parsed = responses.map((r) => r.answers as Answers);
  const allQuestionIds = form.questions.map((q) => q.id);
  const visibleSets = responses.map((r) => resolveVisibleIdsForResponse(r, allQuestionIds));

  const questions: QuestionOverview[] = [];

  for (const q of form.questions) {
    const values = parsed.map((a) => a[q.id]).filter((v) => v !== undefined);

    const shownCount = visibleSets.filter((s) => s.has(q.id)).length;
    const hiddenCount = totalResponses - shownCount;
    const skippedCount = shownCount - values.length;
    const visibility = { shownCount, skippedCount, hiddenCount };

    if (q.type === "TEXT" || q.type === "DATE") {
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
        ...visibility,
      });
    } else if (q.type === "NUMBER") {
      const nums = values as number[];

      if (!nums.length) {
        questions.push({
          id: q.id,
          text: q.text,
          type: "NUMBER",
          stats: { avg: 0, min: 0, max: 0 },
          ...visibility,
        });
        continue;
      }

      questions.push({
        id: q.id,
        text: q.text,
        type: "NUMBER",
        stats: {
          avg: nums.reduce((a, b) => a + b, 0) / nums.length,
          min: Math.min(...nums),
          max: Math.max(...nums),
        },
        ...visibility,
      });
    } else if (q.type === "CHOICE_SINGLE" || q.type === "CHOICE_MULTI") {
      const options = (q.options as { id: string; text: string }[]) ?? [];

      const distribution: Record<string, number> = {};

      for (const option of options) {
        distribution[option.id] = 0;
      }

      for (const response of responses) {
        const answer = (response.answers as Answers)?.[q.id];

        if (!answer) continue;

        if (q.type === "CHOICE_SINGLE") {
          if (typeof answer === "string" && distribution[answer] !== undefined) {
            distribution[answer]++;
          }
        }

        if (q.type === "CHOICE_MULTI") {
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
        ...visibility,
      });
    } else if (q.type === "BOOLEAN") {
      const bools = values as boolean[];

      questions.push({
        id: q.id,
        type: "BOOLEAN",
        text: q.text,
        trueCount: bools.filter((v) => v === true).length,
        falseCount: bools.filter((v) => v === false).length,
        ...visibility,
      });
    }
  }

  return {
    totalResponses,
    questions,
  };
};

/**
 * Чиста функція агрегації переходів між видимими питаннями - винесена
 * окремо від getFormPaths, щоб тестувати без моку Prisma. orderedQuestions
 * мають бути відсортовані за order (getFormPaths це гарантує).
 */
export const buildFormPaths = (
  orderedQuestions: { id: string; text: string; order: number }[],
  responses: { answers: unknown; visibleQuestionIds: unknown }[],
): FormPathsDto => {
  const allQuestionIds = orderedQuestions.map((q) => q.id);
  const shownCount: Record<string, number> = {};
  const edgeCount = new Map<string, number>();

  for (const response of responses) {
    const visibleIds = resolveVisibleIdsForResponse(response, allQuestionIds);
    // Послідовність, у якій респондент фактично побачив питання - за order,
    // з пропуском прихованих (не обов'язково сусідні за order).
    const sequence = orderedQuestions.filter((q) => visibleIds.has(q.id));

    let prevId: string | null = null;
    for (const q of sequence) {
      shownCount[q.id] = (shownCount[q.id] || 0) + 1;
      const key = `${prevId ?? "__start__"}->${q.id}`;
      edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
      prevId = q.id;
    }
  }

  const nodes: QuestionPathNode[] = orderedQuestions.map((q) => ({
    questionId: q.id,
    text: q.text,
    order: q.order,
    shownCount: shownCount[q.id] || 0,
  }));

  const edges: QuestionPathEdge[] = Array.from(edgeCount.entries()).map(([key, count]) => {
    const [from, to] = key.split("->");
    return { fromQuestionId: from === "__start__" ? null : from, toQuestionId: to, count };
  });

  return { totalResponses: responses.length, nodes, edges };
};

export const getFormPaths = async (formId: string, userId: string): Promise<FormPathsDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError("Form not found", 404);
  if (form.userId !== userId) throw new AppError("Forbidden", 403);

  const responses = await prisma.response.findMany({
    where: { formId },
    select: { answers: true, visibleQuestionIds: true },
  });

  const orderedQuestions = [...form.questions].sort((a, b) => a.order - b.order);

  return buildFormPaths(orderedQuestions, responses);
};

/**
 * Чиста функція агрегації funnel - винесена окремо від getFormFunnel, щоб
 * тестувати без моку Prisma (той самий підхід, що й buildFormPaths).
 * attempts - рядки ResponseAttempt (і завершені, і ні); reachedCount на
 * питання рахується з visibleQuestionIds КОЖНОГО attempt, не з answers -
 * респондент міг побачити питання й ще не встигнути на нього відповісти,
 * і це все одно "досяг" для funnel-цілей.
 */
export const buildFormFunnel = (
  orderedQuestions: { id: string; text: string; order: number }[],
  attempts: { visibleQuestionIds: unknown; completedAt: Date | null }[],
): FormFunnelDto => {
  const reachedCount: Record<string, number> = {};

  for (const attempt of attempts) {
    const visibleIds = Array.isArray(attempt.visibleQuestionIds)
      ? (attempt.visibleQuestionIds as string[])
      : [];

    for (const id of visibleIds) {
      reachedCount[id] = (reachedCount[id] || 0) + 1;
    }
  }

  const totalAttempts = attempts.length;
  const totalCompletions = attempts.filter((a) => a.completedAt !== null).length;

  const nodes: QuestionFunnelNode[] = orderedQuestions.map((q) => ({
    questionId: q.id,
    text: q.text,
    order: q.order,
    reachedCount: reachedCount[q.id] || 0,
  }));

  return {
    totalAttempts,
    totalCompletions,
    completionRate: totalAttempts > 0 ? totalCompletions / totalAttempts : 0,
    nodes,
  };
};

export const getFormFunnel = async (formId: string, userId: string): Promise<FormFunnelDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError("Form not found", 404);
  if (form.userId !== userId) throw new AppError("Forbidden", 403);

  const attempts = await prisma.responseAttempt.findMany({
    where: { formId },
    select: { visibleQuestionIds: true, completedAt: true },
  });

  const orderedQuestions = [...form.questions].sort((a, b) => a.order - b.order);

  return buildFormFunnel(orderedQuestions, attempts);
};

export const getQuestionAnalytics = async (
  formId: string,
  questionId: string,
  userId: string,
): Promise<QuestionAnalyticsDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError("Form not found", 404);
  if (form.userId !== userId) throw new AppError("Forbidden", 403);

  const question = form.questions.find((q) => q.id === questionId);

  if (!question) throw new AppError("Question not found", 404);

  const responses = await prisma.response.findMany({
    where: { formId },
  });

  const values = responses
    .map((r) => (r.answers as any)[questionId])
    .filter((v) => v !== undefined);

  const totalAnswers = values.length;

  if (question.type === "TEXT" || question.type === "DATE") {
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

  if (question.type === "NUMBER") {
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
        type: "NUMBER",
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

  if (question.type === "CHOICE_SINGLE" || question.type === "CHOICE_MULTI") {
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

  if (question.type === "BOOLEAN") {
    const bools = values as boolean[];

    return {
      question: {
        id: question.id,
        text: question.text,
        description: question.description,
        type: "BOOLEAN",
      },
      totalAnswers,
      trueCount: bools.filter(Boolean).length,
      falseCount: bools.filter((v) => !v).length,
    };
  }

  throw new AppError("Unsupported type", 400);
};

export const getResponses = async (
  formId: string,
  userId: string,
  page = 1,
  limit = 10,
): Promise<ResponseListDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) throw new AppError("Form not found", 404);
  if (form.userId !== userId) throw new AppError("Forbidden", 403);

  const skip = (page - 1) * limit;

  const [total, responses] = await Promise.all([
    prisma.response.count({
      where: { formId },
    }),
    prisma.response.findMany({
      where: { formId },
      orderBy: { createdAt: "desc" },
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
  userId: string,
): Promise<ResponseDetailsDto> => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { questions: true },
  });

  if (!form) throw new AppError("Form not found", 404);
  if (form.userId !== userId) throw new AppError("Forbidden", 403);

  const response = await prisma.response.findUnique({
    where: { id: responseId },
  });

  if (!response || response.formId !== formId) {
    throw new AppError("Response not found", 404);
  }

  const rawAnswers = response.answers as Record<string, any>;
  const enrichedAnswers: EnrichedAnswer[] = [];

  for (const q of form.questions) {
    const userValue = rawAnswers[q.id];

    if (userValue === undefined || userValue === null) {
      continue;
    }

    let displayValue: string | number | string[] = "";

    if (q.type === "CHOICE_SINGLE") {
      const option = (q.options as any[] | null)?.find((o) => o.id === userValue);
      displayValue = option ? option.text : `Опція видалена (${userValue})`;
    } else if (q.type === "CHOICE_MULTI") {
      const optionIds = userValue as string[];
      const options = q.options as any[];

      displayValue = optionIds.map((id) => {
        const opt = options?.find((o) => o.id === id);
        return opt ? opt.text : `Невідformattingована опція (${id})`;
      });
    } else if (q.type === "BOOLEAN") {
      displayValue = userValue === true ? "Так" : "Ні";
    } else {
      displayValue = userValue;
    }

    enrichedAnswers.push({
      questionId: q.id,
      questionText: q.text || "Питання без назви",
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
