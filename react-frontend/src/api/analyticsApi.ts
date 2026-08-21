import { type FormAnalyticsDto, type QuestionAnalyticsDto } from "../types/analytics";
import { api } from "./axios";

export const analyticsApi = {
  getOverview: async (formId: string): Promise<FormAnalyticsDto> => {
    const response = await api.get(`/forms/${formId}/analytics`);
    return response.data;
  },

  getQuestionDetails: async (formId: string, questionId: string): Promise<QuestionAnalyticsDto> => {
    const response = await api.get(`/forms/${formId}/questions/${questionId}/analytics`);
    return response.data;
  },
};
