import { type QuestionType } from "./formBuilder";

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

export interface QuestionOverview {
  id: string;
  text: string;
  type: QuestionType;
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
    type: QuestionType;
  };
  totalAnswers: number;
  distribution?: { value: string | number; optionId: string; count: number; text: string }[];
  stats?: NumberStats;
  answers?: string[];
  trueCount?: number;
  falseCount?: number;
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
