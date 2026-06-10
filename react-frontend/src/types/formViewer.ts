export interface FormResponsePayload {
  formId: string;
  responses: {
    questionId: string;
    value: AnswerValue;
  }[];
}

export type AnswerValue = string | number | boolean | string[];

export type FormAnswers = Record<string, AnswerValue>;
