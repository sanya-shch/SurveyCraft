import type { QuestionType } from "./types/formBuilder";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  TEXT: "Текстове поле",
  NUMBER: "Числове поле",
  CHOICE_SINGLE: "Один вибір",
  CHOICE_MULTI: "Кілька виборів",
  BOOLEAN: "Так / Ні",
  DATE: "Вибір дати",
} as const;
