import { type Question } from "../../types/formBuilder";
import { type AnswerValue } from "../../types/formViewer";

/**
 * Валідація одного поля відповіді - винесена окремо від FormViewer, щоб
 * той самий набір правил (required, min/max length, email/name regex,
 * кастомний pattern, min/max для чисел) однаково працював і в режимі
 * "усі питання на сторінці" (FormViewer), і в режимі "по одному питанню"
 * (QuestionStepper). Дублювання цих правил у двох місцях рано чи пізно
 * розійшлося б (наприклад, поправили regex email в одному, забули в іншому).
 */
export const validateField = (q: Question, value: AnswerValue): string | null => {
  const isEmptyText = typeof value === "string" && value.trim() === "";
  const isEmptyArray = Array.isArray(value) && value.length === 0;
  const isUndefinedOrNull = value === undefined || value === null || value === "";
  const isEmpty = isEmptyText || isEmptyArray || isUndefinedOrNull;

  if (q.required && isEmpty) {
    return "Це поле є обов'язковим для заповнення";
  }

  if (isEmpty) return null;

  if (q.type === "NUMBER" && typeof value === "number") {
    if (q.config?.min !== undefined && value < q.config.min)
      return `Значення має бути не менше ${q.config.min}`;
    if (q.config?.max !== undefined && value > q.config.max)
      return `Значення має бути не більше ${q.config.max}`;
  }

  if (q.type === "TEXT" && typeof value === "string") {
    const trimmedValue = value.trim();

    if (q.config?.minLength !== undefined && trimmedValue.length < q.config.minLength) {
      return `Мінімальна кількість символів: ${q.config.minLength}`;
    }
    if (q.config?.maxLength !== undefined && trimmedValue.length > q.config.maxLength) {
      return `Максимальна кількість символів: ${q.config.maxLength}`;
    }

    if (q.config?.variant === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedValue)) {
        return "Введіть коректну електронну адресу";
      }
    }

    if (q.config?.variant === "name") {
      const nameRegex = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'\u2019\u02BC-]+$/;
      if (!nameRegex.test(trimmedValue)) {
        return "Ім'я може містити лише літери, пробіли або дефіси";
      }
    }

    if (q.config?.pattern) {
      const regex = new RegExp(q.config.pattern);
      if (!regex.test(trimmedValue)) {
        return "Невірний формат вводу";
      }
    }
  }

  return null;
};

export const getDefaultAnswer = (q: Question): AnswerValue => {
  if (q.type === "BOOLEAN") return q.config?.defaultValue ?? false;
  if (q.type === "CHOICE_SINGLE") {
    const defaultOpt = q.options?.find((o) => o.isDefault);
    return defaultOpt ? defaultOpt.id : "";
  }
  if (q.type === "CHOICE_MULTI") {
    return q.options?.filter((o) => o.isDefault).map((o) => o.id) || [];
  }
  return "";
};

/** Валідує набір питань (типово - лише видимі) і повертає мапу помилок questionId -> текст. */
export const validateAll = (
  questions: Question[],
  answers: Record<string, AnswerValue>,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  questions.forEach((q, index) => {
    const qId = q.id || `q-${index}`;
    const error = validateField(q, answers[qId]);
    if (error) errors[qId] = error;
  });
  return errors;
};

/**
 * Формує payload для відправки: пропускає порожні необов'язкові поля,
 * лишає тільки питання з переданого списку (типово - лише видимі/пройдені).
 * Той самий фінальний "cleanup", що й submitResponse на бекенді (Етап 2),
 * але тут - для чистоти запиту, а не для безпеки (сервер все одно
 * перевіряє видимість самостійно).
 */
export const buildCleanedAnswers = (
  questions: Question[],
  answers: Record<string, AnswerValue>,
): Record<string, AnswerValue> => {
  const cleaned: Record<string, AnswerValue> = {};
  questions.forEach((question) => {
    const qId = question.id;
    if (!qId) return;

    const value = answers[qId];
    const isEmptyText = typeof value === "string" && value.trim() === "";
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    const isUndefinedOrNull = value === undefined || value === null || value === "";

    if (!question.required && (isEmptyText || isEmptyArray || isUndefinedOrNull)) {
      return;
    }

    cleaned[qId] = value;
  });
  return cleaned;
};
