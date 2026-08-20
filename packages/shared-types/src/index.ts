export const AUTH_EXPIRED_EVENT = "surveycraft:auth-expired";

export type ResponseMode = "ALL_AT_ONCE" | "STEP_BY_STEP";

export type ConditionOperator = "equals" | "notEquals" | "contains" | "in" | "gt" | "lt";

export type ConditionValue = string | number | boolean | string[];

export interface ConditionRule {
  questionId: string;
  operator: ConditionOperator;
  value: ConditionValue;
}

export interface ConditionGroup {
  logic: "AND" | "OR";
  rules: ConditionRule[];
}

export interface QuestionVisibilityStats {
  shownCount: number;
  skippedCount: number;
  hiddenCount: number;
}

export interface TextPreview {
  value: string;
  count: number;
}

export interface NumberStats {
  avg: number;
  min: number;
  max: number;
}

export interface ChoiceDistribution {
  optionId: string;
  count: number;
  text: string;
}

export type QuestionAnalyticsType =
  | "TEXT"
  | "CHOICE_SINGLE"
  | "CHOICE_MULTI"
  | "BOOLEAN"
  | "DATE"
  | "NUMBER";

export interface QuestionOverview extends Partial<QuestionVisibilityStats> {
  id: string;
  text: string;
  type: QuestionAnalyticsType;
  preview?: TextPreview[];
  stats?: NumberStats;
  distribution?: ChoiceDistribution[];
  trueCount?: number;
  falseCount?: number;
}

export interface FormAnalyticsDto {
  totalResponses: number;
  questions: QuestionOverview[];
}

export interface QuestionAnalyticsDto {
  question: {
    id: string;
    text: string;
    description: string | null;
    type: QuestionAnalyticsType;
  };
  totalAnswers: number;
  distribution?: { value: string | number; optionId: string; count: number; text: string }[];
  stats?: NumberStats;
  answers?: string[];
  trueCount?: number;
  falseCount?: number;
}

/** Вузол шляху проходження форми - питання + скільки респондентів його бачили. */
export interface QuestionPathNode {
  questionId: string;
  text: string;
  order: number;
  shownCount: number;
}

/**
 * Перехід між двома послідовними ВИДИМИМИ питаннями серед завершених
 * відповідей. fromQuestionId: null - перехід зі старту форми до першого
 * показаного питання. Це НЕ funnel/drop-off аналітика - для того є
 * FormFunnelDto (нижче), який рахується з ResponseAttempt (autosave-
 * чернетки) і бачить покинуті проходження, не лише завершені Response.
 */
export interface QuestionPathEdge {
  fromQuestionId: string | null;
  toQuestionId: string;
  count: number;
}

export interface FormPathsDto {
  totalResponses: number;
  nodes: QuestionPathNode[];
  edges: QuestionPathEdge[];
}

export interface QuestionFunnelNode {
  questionId: string;
  text: string;
  order: number;
  reachedCount: number;
}

export interface FormFunnelDto {
  totalAttempts: number;
  totalCompletions: number;
  completionRate: number;
  nodes: QuestionFunnelNode[];
}

export interface ResponseSummary {
  id: string;
  createdAt: string;
}

export interface ResponseListDto {
  total: number;
  page: number;
  limit: number;
  data: ResponseSummary[];
}

export interface EnrichedAnswer {
  questionId: string;
  questionText: string;
  questionType: string;
  questionDescription: string | null;
  questionRequired: boolean;
  displayValue: string | number | string[];
  rawValue: string | number | string[];
}

export interface ResponseDetailsDto {
  id: string;
  formId: string;
  createdAt: string;
  answers: EnrichedAnswer[];
}
