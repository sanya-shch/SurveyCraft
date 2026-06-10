import { Answers } from '../response/response.types.js';

export type QuestionOverview =
  | {
      id: string;
      type: 'TEXT' | 'DATE';
      text: string;
      preview: { value: string; count: number }[];
    }
  | {
      id: string;
      type: 'NUMBER';
      text: string;
      stats: {
        avg: number;
        min: number;
        max: number;
      };
    }
  | {
      id: string;
      type: 'CHOICE_SINGLE' | 'CHOICE_MULTI';
      text: string;
      distribution: { optionId: string; count: number; text: string }[];
    }
  | {
      id: string;
      type: 'BOOLEAN';
      text: string;
      trueCount: number;
      falseCount: number;
    };

export type FormAnalyticsDto = {
  totalResponses: number;
  questions: QuestionOverview[];
};

export type QuestionAnalyticsDto =
  | {
      question: {
        id: string;
        text: string;
        description: string | null;
        type: 'TEXT' | 'DATE';
      };
      totalAnswers: number;
      distribution: { value: string; count: number }[];
      answers: string[];
    }
  | {
      question: {
        id: string;
        text: string;
        description: string | null;
        type: 'NUMBER';
      };
      totalAnswers: number;
      stats: {
        avg: number;
        min: number;
        max: number;
      };
      distribution: { value: number; count: number }[];
    }
  | {
      question: {
        id: string;
        text: string;
        description: string | null;
        type: 'CHOICE_SINGLE' | 'CHOICE_MULTI';
      };
      totalAnswers: number;
      distribution: { optionId: string; count: number; text: string }[];
    }
  | {
      question: {
        id: string;
        text: string;
        description: string | null;
        type: 'BOOLEAN';
      };
      totalAnswers: number;
      trueCount: number;
      falseCount: number;
    };

export type ResponseListItem = {
  id: string;
  createdAt: Date;
  answersPreview?: Record<string, any>;
};

export type ResponseListDto = {
  total: number;
  page: number;
  limit: number;
  data: ResponseListItem[];
};

export type GetResponsesQuery = {
  page?: string;
  limit?: string;
};

export interface EnrichedAnswer {
  questionId: string;
  questionText: string;
  questionType: string;
  questionDescription: string | null;
  questionRequired: boolean;
  displayValue: string | number | string[];
  rawValue: string | number | string[];
}

export type ResponseDetailsDto = {
  id: string;
  formId: string;
  createdAt: Date;
  answers: EnrichedAnswer[];
};
